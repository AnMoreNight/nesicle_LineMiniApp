import type { Prisma } from "@nesicle/db";

// 振込申請できる申込の条件: 紹介者の完了報告済み + 運営の成果確認・報酬確定済み(CONFIRMED)
// + まだどの振込申請にも含まれていない。述語版と Prisma の where 版は必ず同じ条件に保つこと。
export function isPayoutEligible(a: {
  rewardStatus: string;
  referrerReportedAt: Date | null;
  payoutRequestId: string | null;
}): boolean {
  return a.rewardStatus === "CONFIRMED" && a.referrerReportedAt !== null && a.payoutRequestId === null;
}

export const payoutEligibleWhere = {
  rewardStatus: "CONFIRMED",
  referrerReportedAt: { not: null },
  payoutRequestId: null,
} satisfies Prisma.ApplicationWhereInput;
