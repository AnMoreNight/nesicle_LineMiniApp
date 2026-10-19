import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import type { PayoutRequestDto } from "@nesicle/shared";
import { requireReferrer } from "../lib/auth.js";
import { payoutEligibleWhere } from "../lib/payoutEligibility.js";

class ClaimConflictError extends Error {}

function toDto(p: {
  id: string;
  amount: number;
  method: PayoutRequestDto["method"];
  status: PayoutRequestDto["status"];
  requestedAt: Date;
  paidAt: Date | null;
  applications: Array<{ rewardAmount: number | null; case: { title: string } }>;
}): PayoutRequestDto {
  return {
    id: p.id,
    amount: p.amount,
    method: p.method,
    status: p.status,
    requestedAt: p.requestedAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
    applications: p.applications.map((a) => ({ caseTitle: a.case.title, rewardAmount: a.rewardAmount })),
  };
}

export default async function payoutsRoutes(app: FastifyInstance) {
  app.get("/api/me/payout-requests", { preHandler: requireReferrer }, async (request) => {
    const requests = await prisma.payoutRequest.findMany({
      where: { userId: request.referrerUserId },
      include: { applications: { include: { case: true } } },
      orderBy: { requestedAt: "desc" },
    });
    return requests.map(toDto);
  });

  app.post("/api/me/payout-requests", { preHandler: requireReferrer }, async (request, reply) => {
    const profile = await prisma.referrerProfile.findUnique({
      where: { userId: request.referrerUserId },
      include: { bankAccount: true },
    });
    if (!profile?.bankAccount) {
      return reply.code(400).send({ error: "振込先口座を登録してください。" });
    }

    const eligible = await prisma.application.findMany({
      where: { referralLink: { referrerId: request.referrerUserId }, ...payoutEligibleWhere },
    });
    if (eligible.length === 0) {
      return reply.code(400).send({ error: "振込申請できる確定報酬がありません。" });
    }
    const amount = eligible.reduce((sum, a) => sum + (a.rewardAmount ?? 0), 0);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const payoutRequest = await tx.payoutRequest.create({ data: { userId: request.referrerUserId, amount } });
        // 「まだ未申請の行だけ」を条件に付け替える。並行リクエストが先に同じ申込を確保していれば
        // 件数が一致しないのでロールバックし、同じ報酬が二重に申請されないようにする。
        const claimed = await tx.application.updateMany({
          where: { id: { in: eligible.map((a) => a.id) }, ...payoutEligibleWhere },
          data: { payoutRequestId: payoutRequest.id },
        });
        if (claimed.count !== eligible.length) throw new ClaimConflictError();
        return tx.payoutRequest.findUniqueOrThrow({
          where: { id: payoutRequest.id },
          include: { applications: { include: { case: true } } },
        });
      });
      return reply.code(201).send(toDto(created));
    } catch (err) {
      if (err instanceof ClaimConflictError) {
        return reply.code(409).send({ error: "振込申請の対象が更新されました。画面を再読み込みしてください。" });
      }
      throw err;
    }
  });
}
