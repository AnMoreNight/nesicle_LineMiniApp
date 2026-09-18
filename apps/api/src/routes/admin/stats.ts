import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";

export default async function adminStatsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/stats", async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [referrerCount, publishedCaseCount, applicationsThisMonth, confirmedApplications, paidApplications] =
      await Promise.all([
        prisma.user.count(),
        prisma.case.count({ where: { status: "PUBLISHED" } }),
        prisma.application.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.application.findMany({ where: { rewardStatus: "CONFIRMED" }, select: { rewardAmount: true } }),
        prisma.application.findMany({
          where: { rewardStatus: "PAID", updatedAt: { gte: startOfMonth } },
          select: { rewardAmount: true },
        }),
      ]);

    return {
      referrerCount,
      publishedCaseCount,
      applicationsThisMonth,
      pendingPayoutTotal: confirmedApplications.reduce((sum, a) => sum + (a.rewardAmount ?? 0), 0),
      paidThisMonthTotal: paidApplications.reduce((sum, a) => sum + (a.rewardAmount ?? 0), 0),
    };
  });
}
