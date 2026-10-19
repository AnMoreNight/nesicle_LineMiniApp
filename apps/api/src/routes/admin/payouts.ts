import type { FastifyInstance } from "fastify";
import { Prisma, prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";
import { notifyReferrer } from "../../lib/lineNotify.js";

// 受取先は受取方法ごとに持つ(今は銀行振込 = BankAccount のみ)。運営が申請内容を確認して
// 実際に振り込めるよう、一覧に振込先も含めて返す。
const includeForList = {
  user: { include: { referrerProfile: { include: { bankAccount: true } } } },
  applications: { include: { case: true } },
} satisfies Prisma.PayoutRequestInclude;

export default async function adminPayoutsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/payout-requests", async () => {
    return prisma.payoutRequest.findMany({ include: includeForList, orderBy: { requestedAt: "desc" } });
  });

  app.post("/api/admin/payout-requests/:id/pay", async (request, reply) => {
    const { id } = request.params as { id: string };
    const payoutRequest = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!payoutRequest) return reply.code(404).send({ error: "振込申請が見つかりません。" });
    if (payoutRequest.status === "PAID") return reply.code(409).send({ error: "すでに支払済みです。" });

    // 申込側を先に更新する(後段の include が支払済み反映後の申込を返すように)。
    const [, updated] = await prisma.$transaction([
      prisma.application.updateMany({ where: { payoutRequestId: id }, data: { rewardStatus: "PAID" } }),
      prisma.payoutRequest.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
        include: includeForList,
      }),
    ]);

    // OPTASは毎日開くタイプのサービスではないため、支払完了はLINEでも通知する
    // (notifyReferrer は LINE_MESSAGING_CHANNEL_ACCESS_TOKEN 未設定の間は安全にno-opする)。
    await notifyReferrer(payoutRequest.userId, `振込が完了しました(${payoutRequest.amount.toLocaleString("ja-JP")}円)。`);

    return updated;
  });
}
