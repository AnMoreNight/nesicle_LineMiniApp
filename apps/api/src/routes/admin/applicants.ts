import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";
import { toCsv } from "../../lib/csv.js";

async function loadApplicants() {
  const applicants = await prisma.applicant.findMany({
    include: { applications: { include: { case: true, referralLink: { include: { referrer: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return applicants;
}

export default async function adminApplicantsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/applicants", async () => {
    return loadApplicants();
  });

  app.get("/api/admin/applicants/export.csv", async (_request, reply) => {
    const applicants = await loadApplicants();
    const rows = applicants.flatMap((applicant) =>
      applicant.applications.map((a) => [
        applicant.id,
        applicant.fullName,
        applicant.phone,
        applicant.email,
        applicant.address,
        a.case.title,
        a.referralLink.referrer.displayName,
        a.progressStatus,
        a.rewardStatus,
        a.rewardAmount ?? "",
        a.createdAt.toISOString(),
      ]),
    );
    const csv = toCsv(
      ["申込者ID", "氏名", "電話番号", "メール", "住所", "案件", "紹介者", "進捗", "報酬状況", "報酬額", "申込日"],
      rows,
    );
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="applicants.csv"`);
    return csv;
  });

  app.get("/api/admin/applicants/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: { applications: { include: { case: true, referralLink: { include: { referrer: true } } } } },
    });
    if (!applicant) return reply.code(404).send({ error: "申込者が見つかりません。" });
    return applicant;
  });
}
