"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { CaseDetailDto } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { MoneyText } from "@/components/MoneyText";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: c, loading, error } = useApiGet<CaseDetailDto>(`/api/cases/${id}`);

  if (loading) return <PageSpinner />;
  if (error || !c) {
    return (
      <div>
        <PageHeader title="案件詳細" />
        <p className="px-5 py-10 text-center text-sm text-ink-muted">{error ?? "案件が見つかりません。"}</p>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader title="案件詳細" />
      <main className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">{c.category}</span>
          <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-bold text-ink-muted">{c.area}</span>
        </div>
        <h1 className="text-xl font-extrabold leading-snug">{c.title}</h1>
        <p className="text-xs text-ink-muted">掲載企業: {c.companyName}</p>

        <div className={card}>
          <p className="text-xs text-ink-muted">紹介報酬</p>
          <MoneyText amount={c.rewardAmount} className="text-2xl" />
          <span className="ml-1 text-xs font-bold text-money">({c.rewardLabel})</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-extrabold">サービス内容</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{c.description}</p>
        </section>

        {c.eligibilityNotes && (
          <section className="space-y-1 rounded-md bg-info-soft p-3">
            <h2 className="text-xs font-extrabold text-info">対象条件</h2>
            <p className="text-xs leading-relaxed text-ink">{c.eligibilityNotes}</p>
          </section>
        )}
        {c.ineligibleNotes && (
          <section className="space-y-1 rounded-md bg-warning-soft p-3">
            <h2 className="text-xs font-extrabold text-warning">対象外となる場合</h2>
            <p className="text-xs leading-relaxed text-ink">{c.ineligibleNotes}</p>
          </section>
        )}
        {c.rewardTimingNotes && (
          <section className="space-y-1 rounded-md bg-money-soft p-3">
            <h2 className="text-xs font-extrabold text-money">報酬が確定するタイミング</h2>
            <p className="text-xs leading-relaxed text-ink">{c.rewardTimingNotes}</p>
          </section>
        )}
      </main>

      <div className="safe-bottom fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface p-3">
        <Link href={`/refer?preselect=${c.id}`} className={clsx(btnPrimary, "block w-full text-center")}>
          この案件を紹介する →
        </Link>
      </div>
    </div>
  );
}
