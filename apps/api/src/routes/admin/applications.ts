import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma, prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";
import { toCsv } from "../../lib/csv.js";

const querySchema = z.object({
  progressStatus: z.enum(["APPLIED", "INTERVIEWING", "CONTRACTED", "INELIGIBLE"]).optional(),
  rewardStatus: z.enum(["UNCONFIRMED", "CONFIRMED", "PAID"]).optional(),
  caseId: z.string().optional(),
  referrerId: z.string().optional(),
  q: z.string().optional(),
});

function buildWhere(query: z.infer<typeof querySchema>): Prisma.ApplicationWhereInput {
  return {
    progressStatus: query.progressStatus,
    rewardStatus: query.rewardStatus,
    caseId: query.caseId,
    referralLink: query.referrerId ? { referrerId: query.referrerId } : undefined,
    applicant: query.q ? { fullName: { contains: query.q, mode: "insensitive" } } : undefined,
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
      ["申込ID", "申込者", "案件", "掲載企業", "紹介者", "進捗状況", "成果/報酬状況", "報酬額", "対象外理由", "申込日", "更新日"],
      applications.map((a) => [
        a.id,
        a.applicant.fullName,
        a.case.title,
        a.case.company.name,
        a.referralLink.referrer.displayName,
        a.progressStatus,
        a.rewardStatus,
        a.rewardAmount ?? "",
        a.ineligibleReason ?? "",
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
    const application = await prisma.application.update({
      where: { id },
      data: parsed.data,
      include: includeForList,
    });
    return application;
  });
}
