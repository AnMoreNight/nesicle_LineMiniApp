import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";
import { toCsv } from "../../lib/csv.js";

async function loadReferrers() {
  const users = await prisma.user.findMany({
    include: {
      referrerProfile: { include: { bankAccount: true } },
      referralLinks: {
        include: { applications: { include: { case: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const applications = u.referralLinks.flatMap((l) => l.applications);
    const confirmedTotal = applications
      .filter((a) => a.rewardStatus === "CONFIRMED")
      .reduce((sum, a) => sum + (a.rewardAmount ?? 0), 0);
    const paidTotal = applications
      .filter((a) => a.rewardStatus === "PAID")
      .reduce((sum, a) => sum + (a.rewardAmount ?? 0), 0);
    return {
      id: u.id,
      displayName: u.displayName,
      fullName: u.referrerProfile?.fullName ?? "",
      phone: u.referrerProfile?.phone ?? "",
      email: u.referrerProfile?.email ?? "",
      hasBankAccount: Boolean(u.referrerProfile?.bankAccount),
      linkCount: u.referralLinks.length,
      applicationCount: applications.length,
      confirmedTotal,
      paidTotal,
      createdAt: u.createdAt,
    };
  });
}

export default async function adminReferrersRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/referrers", async () => {
    return loadReferrers();
  });

  app.get("/api/admin/referrers/export.csv", async (_request, reply) => {
    const referrers = await loadReferrers();
    const csv = toCsv(
      ["紹介者ID", "LINE表示名", "氏名", "電話番号", "メール", "口座登録", "紹介URL数", "申込件数", "確定報酬", "支払済み報酬", "登録日"],
      referrers.map((r) => [
        r.id,
        r.displayName,
        r.fullName,
        r.phone,
        r.email,
        r.hasBankAccount ? "登録済み" : "未登録",
        r.linkCount,
        r.applicationCount,
        r.confirmedTotal,
        r.paidTotal,
        r.createdAt.toISOString(),
      ]),
    );
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", `attachment; filename="referrers.csv"`);
    return csv;
  });

  app.get("/api/admin/referrers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        referrerProfile: { include: { bankAccount: true } },
        referralLinks: {
          include: { cases: { include: { case: true } }, applications: { include: { applicant: true, case: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return reply.code(404).send({ error: "紹介者が見つかりません。" });
    return user;
  });
}
