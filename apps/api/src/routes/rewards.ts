import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import type { RewardsSummaryDto } from "@nesicle/shared";
import { requireReferrer } from "../lib/auth.js";

export default async function rewardsRoutes(app: FastifyInstance) {
  app.get("/api/me/rewards", { preHandler: requireReferrer }, async (request) => {
    const applications = await prisma.application.findMany({
      where: { referralLink: { referrerId: request.referrerUserId } },
      include: { case: true },
    });

    let unconfirmedTotal = 0;
    let confirmedTotal = 0;
    let paidTotal = 0;

    for (const a of applications) {
      if (a.rewardStatus === "CONFIRMED") {
        confirmedTotal += a.rewardAmount ?? 0;
      } else if (a.rewardStatus === "PAID") {
        paidTotal += a.rewardAmount ?? 0;
      } else if (a.progressStatus === "APPLIED" || a.progressStatus === "INTERVIEWING") {
        unconfirmedTotal += a.case.rewardAmount;
      }
    }

    const profile = await prisma.referrerProfile.findUnique({
      where: { userId: request.referrerUserId },
      include: { bankAccount: true },
    });

    const summary: RewardsSummaryDto = {
      unconfirmedTotal,
      confirmedTotal,
      paidTotal,
      lifetimeTotal: confirmedTotal + paidTotal,
      hasBankAccount: Boolean(profile?.bankAccount),
    };
    return summary;
  });
}
