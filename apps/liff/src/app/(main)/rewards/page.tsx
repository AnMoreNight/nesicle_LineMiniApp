"use client";

import Link from "next/link";
import type { ReferrerApplicationDto, RewardsSummaryDto } from "@nesicle/shared";
import { formatYen } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { PageSpinner } from "@/components/Spinner";
import { MoneyText } from "@/components/MoneyText";
import { useApiGet } from "@/lib/useApiGet";
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

export default function RewardsPage() {
  const { data: rewards, loading: rewardsLoading } = useApiGet<RewardsSummaryDto>("/api/me/rewards");
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
