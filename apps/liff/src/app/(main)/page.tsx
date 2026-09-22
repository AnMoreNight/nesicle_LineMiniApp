"use client";

import Link from "next/link";
import { formatYen, type CaseSummaryDto, type RewardsSummaryDto } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { CaseCard } from "@/components/CaseCard";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { useCartStore } from "@/lib/cartStore";
import { useSession } from "@/lib/session";

export default function HomePage() {
  const { user } = useSession();
  const { data: rewards, loading: rewardsLoading } = useApiGet<RewardsSummaryDto>("/api/me/rewards");
  const { data: cases, loading: casesLoading } = useApiGet<CaseSummaryDto[]>("/api/cases");
  const items = useCartStore((s) => s.items);
  const toggle = useCartStore((s) => s.toggle);

  if (rewardsLoading || casesLoading) return <PageSpinner />;

  const recommended = (cases ?? []).slice(0, 2);

  return (
    <div>
      <TopBar title="ネシクル パートナー" subtitle={user ? `${user.displayName} さん、こんにちは` : undefined} />
      <main className="space-y-6 px-5 py-5">
        <section className="rounded-lg bg-gradient-to-br from-primary to-[#048848] p-5 text-white shadow-float">
          <p className="text-xs font-bold opacity-80">これまでの確定報酬</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatYen((rewards?.confirmedTotal ?? 0) + (rewards?.paidTotal ?? 0))}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-md bg-white/20 px-2.5 py-1.5">未確定 {formatYen(rewards?.unconfirmedTotal ?? 0)}</span>
            <span className="rounded-md bg-white/20 px-2.5 py-1.5">支払済み {formatYen(rewards?.paidTotal ?? 0)}</span>
          </div>
          {!rewards?.hasBankAccount && (
            <Link href="/mypage/bank" className="mt-3 block text-xs font-bold underline underline-offset-2 opacity-90">
              振込先口座を登録する →
            </Link>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <p className="text-base font-extrabold">おすすめ案件</p>
            <Link href="/cases" className="text-xs font-bold text-primary">
              すべて見る
            </Link>
          </div>
          <div className="space-y-3">
            {recommended.map((c) => (
              <CaseCard
                key={c.id}
                item={c}
                showAddButton
                inCart={items.some((i) => i.id === c.id)}
                onToggleCart={toggle}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
