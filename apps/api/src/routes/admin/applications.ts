import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma } from "@nesicle/db";
import { formatInquiryNumber, parseInquiryNumber } from "@nesicle/shared";
import { requireAdmin } from "../../lib/auth.js";
import { toCsv } from "../../lib/csv.js";
import { notifyReferrer } from "../../lib/lineNotify.js";

const querySchema = z.object({
  progressStatus: z.enum(["APPLIED", "INTERVIEWING", "CONTRACTED", "INELIGIBLE"]).optional(),
  rewardStatus: z.enum(["UNCONFIRMED", "CONFIRMED", "PAID"]).optional(),
  caseId: z.string().optional(),
  referrerId: z.string().optional(),
  q: z.string().optional(),
  // 完了報告の有無。運営が「報告は来たが未確認」の申込を拾って掲載企業へ確認するために使う。
  reported: z.enum(["yes", "no"]).optional(),
  // Used by the admin notification poller: only applications created after this ISO timestamp.
  createdAfter: z.string().datetime().optional(),
});

// 検索欄は申込者名に加え、お問い合わせ番号でも引ける。"OP-000123-2" はその1件、
// "OP-000123" は同じ申込(まとめて申し込んだ全案件)を返す。
function searchWhere(q: string): Prisma.ApplicationWhereInput {
  const byName: Prisma.ApplicationWhereInput = { applicant: { fullName: { contains: q, mode: "insensitive" } } };
  const n = parseInquiryNumber(q);
  if (!n) return byName;
  const byNumber: Prisma.ApplicationWhereInput = {
    applicant: { inquiryNumber: n.base },
    ...(n.seq !== null ? { inquirySeq: n.seq } : {}),
  };
  return { OR: [byName, byNumber] };
}

function buildWhere(query: z.infer<typeof querySchema>): Prisma.ApplicationWhereInput {
  return {
    progressStatus: query.progressStatus,
    rewardStatus: query.rewardStatus,
    caseId: query.caseId,
    referralLink: query.referrerId ? { referrerId: query.referrerId } : undefined,
    ...(query.q ? searchWhere(query.q) : {}),
    referrerReportedAt: query.reported === "yes" ? { not: null } : query.reported === "no" ? null : undefined,
    createdAt: query.createdAfter ? { gt: new Date(query.createdAfter) } : undefined,
  };
}

const includeForList = {
  applicant: true,
  case: { include: { company: true } },
  referralLink: { include: { referrer: true } },
} satisfies Prisma.ApplicationInclude;

const updateSchema = z.object({
  progressStatus: z.enum(["APPLIED", "INTERVIEWING", "CONTRACTED", "INELIGIBLE"]).optional(),
  rewardStatus: z.enum(["UNCONFIRMED", "CONFIRMED", "PAID"]).optional(),
  rewardAmount: z.coerce.number().int().min(0).nullable().optional(),
  ineligibleReason: z.string().max(500).nullable().optional(),
  internalNotes: z.string().max(2000).optional(),
});

export default async function adminApplicationsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/applications", async (request) => {
    const query = querySchema.parse(request.query);
    return prisma.application.findMany({
      where: buildWhere(query),
      include: includeForList,
      orderBy: { createdAt: "desc" },
    });
  });

  app.get("/api/admin/applications/export.csv", async (request, reply) => {
    const query = querySchema.parse(request.query);
    const applications = await prisma.application.findMany({
      where: buildWhere(query),
      include: includeForList,
      orderBy: { createdAt: "desc" },
    });
    const csv = toCsv(
      ["お問い合わせ番号", "申込ID", "申込者", "案件", "掲載企業", "紹介者", "進捗状況", "成果/報酬状況", "報酬額", "対象外理由", "完了報告日時", "申込日", "更新日"],
      applications.map((a) => [
        formatInquiryNumber(a.applicant.inquiryNumber, a.inquirySeq),
        a.id,
        a.applicant.fullName,
        a.case.title,
        a.case.company.name,
        a.referralLink.referrer.displayName,
        a.progressStatus,
        a.rewardStatus,
        a.rewardAmount ?? "",
        a.ineligibleReason ?? "",
        a.referrerReportedAt?.toISOString() ?? "",
        a.createdAt.toISOString(),
        a.updatedAt.toISOString(),
      ]),
    );
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="applications.csv"`);
    return csv;
  });

  app.get("/api/admin/applications/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const application = await prisma.application.findUnique({ where: { id }, include: includeForList });
    if (!application) return reply.code(404).send({ error: "申込が見つかりません。" });
    return application;
  });

  app.patch("/api/admin/applications/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const current = await prisma.application.findUnique({ where: { id } });
    if (!current) {
      return reply.code(404).send({ error: "申込が見つかりません。" });
    }

    const nextProgress = parsed.data.progressStatus ?? current.progressStatus;
    const nextAmount = parsed.data.rewardAmount !== undefined ? parsed.data.rewardAmount : current.rewardAmount;
    const becomesContracted = nextProgress === "CONTRACTED" && current.progressStatus !== "CONTRACTED";
    const becomesConfirmed = parsed.data.rewardStatus === "CONFIRMED" && current.rewardStatus !== "CONFIRMED";

    // 報酬確定は「掲載企業への成果確認(=契約成立)」の後にしかありえず、振込申請額の根拠にもなるため、
    // 契約成立になっていない・報酬額が未入力のままでは確定できないようにする。
    if (becomesConfirmed && nextProgress !== "CONTRACTED") {
      return reply.code(400).send({ error: "報酬を確定するには、進捗状況を「契約成立」にしてください。" });
    }
    if (becomesConfirmed && nextAmount == null) {
      return reply.code(400).send({ error: "報酬を確定するには、報酬額を入力してください。" });
    }

    const application = await prisma.application.update({
      where: { id },
      data: parsed.data,
      include: includeForList,
    });

    // OPTASは毎日開くタイプのサービスではないため、重要なステータス変更はLINEでも通知する
    // (notifyReferrer は LINE_MESSAGING_CHANNEL_ACCESS_TOKEN 未設定の間は安全にno-opする)。
    const referrerId = application.referralLink.referrerId;
    const title = application.case.title;
    const reportHint = application.referrerReportedAt ? "" : "アプリから完了報告を行うと振込申請できます。";
    if (becomesContracted && becomesConfirmed) {
      await notifyReferrer(referrerId, `「${title}」の成果確認が完了し、報酬が確定しました。${reportHint}`);
    } else if (becomesContracted) {
      await notifyReferrer(referrerId, `「${title}」の成果が確認されました(契約成立)。`);
    } else if (becomesConfirmed) {
      await notifyReferrer(referrerId, `「${title}」の報酬が確定しました。${reportHint}`);
    }

    return application;
  });
}
