"use client";

import { useState } from "react";
import type { ProgressStatus, ReferrerApplicationDto } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { PageSpinner } from "@/components/Spinner";
import { ProgressBadge, RewardBadge } from "@/components/StatusBadge";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import { card } from "@/lib/ui";
import { MoneyText } from "@/components/MoneyText";
import clsx from "clsx";

const FILTERS: { key: string; label: string; statuses?: ProgressStatus[] }[] = [
  { key: "all", label: "すべて" },
  { key: "active", label: "対応中", statuses: ["APPLIED", "INTERVIEWING"] },
  { key: "contracted", label: "成立", statuses: ["CONTRACTED"] },
  { key: "ineligible", label: "対象外", statuses: ["INELIGIBLE"] },
];

function ReportButton({ applicationId, onReported }: { applicationId: string; onReported: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/me/applications/${applicationId}/report`);
      onReported();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "報告に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="w-full rounded-md border border-primary py-2 text-sm font-bold text-primary transition active:scale-[.98] disabled:opacity-40"
      >
        {submitting ? "報告中…" : "完了を報告する"}
      </button>
      <p className="mt-1.5 text-xs text-ink-muted">
        成約・成果が出たらワンタッチで報告してください。運営が掲載企業に確認します。
      </p>
      {error && <p className="mt-1.5 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}

export default function ProgressPage() {
  const { data, loading, reload } = useApiGet<ReferrerApplicationDto[]>("/api/me/applications");
  const [filter, setFilter] = useState("all");

  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  const items = (data ?? []).filter((a) => !activeFilter.statuses || activeFilter.statuses.includes(a.progressStatus));

  return (
    <div>
      <TopBar title="紹介状況" subtitle={`累計 ${data?.length ?? 0}件を紹介`} />
      <main className="space-y-4 px-5 py-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold",
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
                    <p className="text-base font-bold">{a.applicantName} さん</p>
                    <p className="text-sm text-ink-muted">{a.caseTitle}</p>
                  </div>
                  <ProgressBadge status={a.progressStatus} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <RewardBadge status={a.rewardStatus} />
                  {a.rewardAmount != null && <MoneyText amount={a.rewardAmount} className="text-lg" />}
                </div>
                {a.ineligibleReason && (
                  <p className="mt-2 rounded-md bg-surface-muted px-2.5 py-1.5 text-sm text-ink-muted">
                    対象外理由: {a.ineligibleReason}
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-muted">
                  紹介日: {new Date(a.referredAt).toLocaleDateString("ja-JP")}
                </p>

                {a.referrerReportedAt ? (
                  <p className="mt-3 rounded-md bg-primary-soft px-2.5 py-1.5 text-center text-sm font-bold text-primary">
                    完了報告済み ({new Date(a.referrerReportedAt).toLocaleDateString("ja-JP")})
                  </p>
                ) : a.progressStatus !== "INELIGIBLE" && a.rewardStatus !== "PAID" ? (
                  <ReportButton applicationId={a.id} onReported={reload} />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
