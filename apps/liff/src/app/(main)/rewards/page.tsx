"use client";

import { useState } from "react";
import Link from "next/link";
import type { PayoutRequestDto, ReferrerApplicationDto, RewardsSummaryDto } from "@nesicle/shared";
import { formatYen, PAYOUT_REQUEST_STATUS_LABEL_JA } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { PageSpinner } from "@/components/Spinner";
import { MoneyText } from "@/components/MoneyText";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import { card, btnPrimary } from "@/lib/ui";
import clsx from "clsx";

function Section({ title, items }: { title: string; items: ReferrerApplicationDto[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <p className="mb-3 text-base font-extrabold text-ink-muted">{title}</p>
      <div className="space-y-2">
        {items.map((a) => (
          <div key={a.id} className={clsx(card, "flex items-center justify-between")}>
            <div>
              <p className="text-base font-bold">{a.caseTitle}</p>
              <p className="text-sm text-ink-muted">{a.applicantName} さん</p>
            </div>
            {a.rewardAmount != null ? <MoneyText amount={a.rewardAmount} className="text-lg" /> : <span className="text-sm text-ink-muted">査定中</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function PayoutSection({
  rewards,
  unreportedConfirmedCount,
  reload,
}: {
  rewards: RewardsSummaryDto;
  unreportedConfirmedCount: number;
  reload: () => void;
}) {
  const { data: requests, reload: reloadRequests } = useApiGet<PayoutRequestDto[]>("/api/me/payout-requests");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = rewards.payoutEligibleTotal;

  async function handleRequest() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/me/payout-requests");
      reload();
      reloadRequests();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "振込申請に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={clsx(card, "space-y-3")}>
      <div className="flex items-center justify-between">
        <p className="text-base font-extrabold">振込申請できる報酬</p>
        <MoneyText amount={eligible} className="text-xl" />
      </div>

      {!rewards.hasBankAccount ? (
        <p className="text-sm text-ink-muted">振込先口座を登録すると申請できるようになります。</p>
      ) : eligible === 0 ? (
        <p className="text-sm text-ink-muted">振込申請できる確定報酬はまだありません。</p>
      ) : (
        <button type="button" onClick={handleRequest} disabled={submitting} className={clsx(btnPrimary, "w-full")}>
          {submitting ? "申請中…" : "振込申請する"}
        </button>
      )}
      {unreportedConfirmedCount > 0 && (
        <p className="rounded-md bg-warning-soft px-2.5 py-1.5 text-sm text-warning">
          完了報告がまだの確定報酬が{unreportedConfirmedCount}件あります。
          <Link href="/progress" className="font-bold underline underline-offset-2">
            紹介状況
          </Link>
          から完了報告すると申請できます。
        </p>
      )}
      {error && <p className="text-sm font-bold text-danger">{error}</p>}

      {requests && requests.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-bold text-ink-muted">申請履歴</p>
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">
                {new Date(r.requestedAt).toLocaleDateString("ja-JP")} ・ {PAYOUT_REQUEST_STATUS_LABEL_JA[r.status]}
              </span>
              <span className="font-bold tabular-nums">{formatYen(r.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function RewardsPage() {
  const { data: rewards, loading: rewardsLoading, reload } = useApiGet<RewardsSummaryDto>("/api/me/rewards");
  const { data: applications, loading: appsLoading } = useApiGet<ReferrerApplicationDto[]>("/api/me/applications");

  if (rewardsLoading || appsLoading) return <PageSpinner />;

  const confirmed = (applications ?? []).filter((a) => a.rewardStatus === "CONFIRMED");
  const paid = (applications ?? []).filter((a) => a.rewardStatus === "PAID");
  const pending = (applications ?? []).filter(
    (a) => a.rewardStatus === "UNCONFIRMED" && (a.progressStatus === "APPLIED" || a.progressStatus === "INTERVIEWING"),
  );

  return (
    <div>
      <TopBar title="報酬" />
      <main className="space-y-6 px-5 py-5">
        <section className="rounded-lg bg-ink p-5 text-white shadow-float">
          <p className="text-sm font-bold text-white/70">累計報酬(確定+支払済み)</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">{formatYen(rewards?.lifetimeTotal ?? 0)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-bold">
            <div className="rounded-md bg-white/10 py-2">
              <p className="text-white/60">未確定</p>
              <p className="mt-0.5">{formatYen(rewards?.unconfirmedTotal ?? 0)}</p>
            </div>
            <div className="rounded-md bg-white/10 py-2">
              <p className="text-white/60">確定・未払い</p>
              <p className="mt-0.5">{formatYen(rewards?.confirmedTotal ?? 0)}</p>
            </div>
            <div className="rounded-md bg-white/10 py-2">
              <p className="text-white/60">支払済み</p>
              <p className="mt-0.5">{formatYen(rewards?.paidTotal ?? 0)}</p>
            </div>
          </div>
        </section>

        {!rewards?.hasBankAccount && (
          <div className={clsx(card, "flex items-center justify-between gap-3 border-warning/40 bg-warning-soft")}>
            <p className="text-sm font-bold text-warning">報酬の受け取りには振込先口座の登録が必要です</p>
            <Link href="/mypage/bank" className={clsx(btnPrimary, "!px-3 !py-2 text-sm")}>
              登録する
            </Link>
          </div>
        )}

        {rewards && (
          <PayoutSection
            rewards={rewards}
            unreportedConfirmedCount={confirmed.filter((a) => !a.referrerReportedAt).length}
            reload={reload}
          />
        )}

        <Section title="確定・未払い" items={confirmed} />
        <Section title="支払済み" items={paid} />
        <Section title="未確定(査定・面談中)" items={pending} />

        {confirmed.length + paid.length + pending.length === 0 && (
          <p className="text-center text-sm text-ink-muted">まだ報酬の実績がありません。</p>
        )}
      </main>
    </div>
  );
}
