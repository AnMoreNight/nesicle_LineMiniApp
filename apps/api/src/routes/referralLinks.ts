import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { generateReferralCode } from "@nesicle/shared";
import type { ReferralLinkDto } from "@nesicle/shared";
import { env } from "../env.js";
import { requireReferrer } from "../lib/auth.js";
import { hasAgreedToTerms } from "../lib/consent.js";
import { serializeReferralLinkCase } from "../lib/serialize.js";

const createSchema = z.object({
  caseIds: z.array(z.string().min(1)).min(1, "案件を1件以上選択してください。"),
});

async function createUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const existing = await prisma.referralLink.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique referral code");
}

function toDto(
  link: {
    id: string;
    code: string;
    createdAt: Date;
    cases: { case: Parameters<typeof serializeReferralLinkCase>[0] }[];
  },
  referrerName: string,
): ReferralLinkDto {
  return {
    id: link.id,
    code: link.code,
    url: `${env.publicLiffAppUrl}/r/${link.code}`,
    createdAt: link.createdAt.toISOString(),
    cases: link.cases.map((rc) => serializeReferralLinkCase(rc.case)),
    referrerName,
  };
}

// 取引条件に記載する紹介者(受託者)の名称: プロフィールの氏名、未登録ならLINEの表示名
async function referrerNameOf(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { referrerProfile: true } });
  return user?.referrerProfile?.fullName.trim() || user?.displayName || "";
}

export default async function referralLinksRoutes(app: FastifyInstance) {
  app.post("/api/referral-links", { preHandler: requireReferrer }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    // 利用規約に同意する前は紹介URLを発行できない(顧問弁護士の指摘による同意フロー)
    if (!(await hasAgreedToTerms(request.referrerUserId))) {
      return reply.code(403).send({ error: "紹介URLを発行するには、利用規約への同意が必要です。" });
    }
    const cases = await prisma.case.findMany({
      where: { id: { in: parsed.data.caseIds }, status: "PUBLISHED" },
      include: { company: true },
    });
    if (cases.length !== parsed.data.caseIds.length) {
      return reply.code(400).send({ error: "選択された案件の一部が公開されていません。" });
    }

    const code = await createUniqueCode();
    const link = await prisma.referralLink.create({
      data: {
        code,
        referrerId: request.referrerUserId,
        cases: { create: parsed.data.caseIds.map((caseId) => ({ caseId })) },
      },
      include: { cases: { include: { case: { include: { company: true } } } } },
    });

    // These cases are now issued as a real referral link, no longer just "pending selection".
    await prisma.referralSelection.deleteMany({
      where: { userId: request.referrerUserId, caseId: { in: parsed.data.caseIds } },
    });

    return toDto({ ...link, cases: link.cases.map((rc) => ({ case: rc.case })) }, await referrerNameOf(request.referrerUserId));
  });

  app.get("/api/me/referral-links", { preHandler: requireReferrer }, async (request) => {
    const links = await prisma.referralLink.findMany({
      where: { referrerId: request.referrerUserId },
      include: { cases: { include: { case: { include: { company: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    const referrerName = await referrerNameOf(request.referrerUserId);
    return links.map((link) => toDto({ ...link, cases: link.cases.map((rc) => ({ case: rc.case })) }, referrerName));
  });

  app.delete("/api/me/referral-links/:id", { preHandler: requireReferrer }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const link = await prisma.referralLink.findFirst({
      where: { id, referrerId: request.referrerUserId },
    });
    if (!link) {
      return reply.code(404).send({ error: "紹介URLが見つかりません。" });
    }
    const applicationCount = await prisma.application.count({ where: { referralLinkId: id } });
    if (applicationCount > 0) {
      return reply.code(400).send({ error: "この紹介URLはすでに申込みが発生しているため削除できません。" });
    }
    await prisma.referralLink.delete({ where: { id } });
    return { ok: true };
  });
}
