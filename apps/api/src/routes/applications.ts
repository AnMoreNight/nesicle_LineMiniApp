import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import type { ReferrerApplicationDto } from "@nesicle/shared";
import { requireReferrer } from "../lib/auth.js";

function toDto(a: {
  id: string;
  applicant: { fullName: string };
  case: { title: string };
  progressStatus: ReferrerApplicationDto["progressStatus"];
  rewardStatus: ReferrerApplicationDto["rewardStatus"];
  rewardAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
  ineligibleReason: string | null;
  referrerReportedAt: Date | null;
}): ReferrerApplicationDto {
  return {
    id: a.id,
    applicantName: a.applicant.fullName,
    caseTitle: a.case.title,
    progressStatus: a.progressStatus,
    rewardStatus: a.rewardStatus,
    rewardAmount: a.rewardAmount,
    referredAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    ineligibleReason: a.ineligibleReason,
    referrerReportedAt: a.referrerReportedAt?.toISOString() ?? null,
  };
}

export default async function applicationsRoutes(app: FastifyInstance) {
  app.get("/api/me/applications", { preHandler: requireReferrer }, async (request) => {
    const applications = await prisma.application.findMany({
      where: { referralLink: { referrerId: request.referrerUserId } },
      include: { applicant: true, case: true },
      orderBy: { createdAt: "desc" },
    });
    return applications.map(toDto);
  });

  // パートナー(紹介者)がワンタッチで行う「完了報告」。成果が出たはずだという自己申告であり、
  // これ自体は報酬確定を意味しない — 運営が掲載企業へ成果確認を行うきっかけとなるシグナル。
  // そのため運営が契約成立を反映する前(申込・面談中)から報告できる必要がある。
  app.post("/api/me/applications/:id/report", { preHandler: requireReferrer }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const application = await prisma.application.findUnique({
      where: { id },
      include: { referralLink: true },
    });
    if (!application || application.referralLink.referrerId !== request.referrerUserId) {
      return reply.code(404).send({ error: "申込が見つかりません。" });
    }
    if (application.referrerReportedAt) {
      return reply.code(409).send({ error: "すでに完了報告済みです。" });
    }
    if (application.progressStatus === "INELIGIBLE" || application.rewardStatus === "PAID") {
      return reply.code(400).send({ error: "この申込は完了報告の対象外です。" });
    }

    await prisma.application.update({
      where: { id },
      data: { referrerReportedAt: new Date() },
    });

    return { ok: true };
  });
}
