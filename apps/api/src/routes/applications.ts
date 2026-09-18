import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import type { ReferrerApplicationDto } from "@nesicle/shared";
import { requireReferrer } from "../lib/auth.js";

export default async function applicationsRoutes(app: FastifyInstance) {
  app.get("/api/me/applications", { preHandler: requireReferrer }, async (request) => {
    const applications = await prisma.application.findMany({
      where: { referralLink: { referrerId: request.referrerUserId } },
      include: { applicant: true, case: true },
      orderBy: { createdAt: "desc" },
    });

    const dtos: ReferrerApplicationDto[] = applications.map((a) => ({
      id: a.id,
      applicantName: a.applicant.fullName,
      caseTitle: a.case.title,
      progressStatus: a.progressStatus,
      rewardStatus: a.rewardStatus,
      rewardAmount: a.rewardAmount,
      referredAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      ineligibleReason: a.ineligibleReason,
    }));
    return dtos;
  });
}
