"use client";

import { useState } from "react";
import type { ProgressStatus, ReferrerApplicationDto } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { PageSpinner } from "@/components/Spinner";
import { ProgressBadge, RewardBadge } from "@/components/StatusBadge";
import { useApiGet } from "@/lib/useApiGet";
import { card } from "@/lib/ui";
import { MoneyText } from "@/components/MoneyText";
import clsx from "clsx";

const FILTERS: { key: string; label: string; statuses?: ProgressStatus[] }[] = [
  { key: "all", label: "すべて" },
  { key: "active", label: "対応中", statuses: ["APPLIED", "INTERVIEWING"] },
  { key: "contracted", label: "成立", statuses: ["CONTRACTED"] },
  { key: "ineligible", label: "対象外", statuses: ["INELIGIBLE"] },
];

export default function ProgressPage() {
  const { data, loading } = useApiGet<ReferrerApplicationDto[]>("/api/me/applications");
  const [filter, setFilter] = useState("all");

  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const items = (data ?? []).filter((a) => !activeFilter.statuses || activeFilter.statuses.includes(a.progressStatus));

  return (
    <div>
      <TopBar title="紹介状況" subtitle={`累計 ${data?.length ?? 0}件を紹介`} />
      <main className="space-y-4 px-5 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                "shrink-0 rounded-full border px-4 py-2 text-base font-bold",
                filter === f.key ? "border-primary bg-primary text-white" : "border-border bg-surface text-ink-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState icon="📋" title="該当する紹介実績がありません" description="紹介URLを共有すると、ここに進捗が表示されます。" />
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className={card}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">{a.applicantName} さん</p>
                    <p className="text-base text-ink-muted">{a.caseTitle}</p>
                  </div>
                  <ProgressBadge status={a.progressStatus} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <RewardBadge status={a.rewardStatus} />
                  {a.rewardAmount != null && <MoneyText amount={a.rewardAmount} className="text-xl" />}
                </div>
                {a.ineligibleReason && (
                  <p className="mt-2 rounded-md bg-surface-muted px-2.5 py-1.5 text-base text-ink-muted">
                    対象外理由: {a.ineligibleReason}
                  </p>
                )}
                <p className="mt-2 text-sm text-ink-muted">
                  紹介日: {new Date(a.referredAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
