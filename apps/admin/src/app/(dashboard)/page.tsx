"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatYen } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { ErrorState, LoadingState, PageHeader } from "@/components/ui";
import type { AdminStats } from "@/types/admin";

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "統計情報の取得に失敗しました。"));
  }, []);

  return (
    <div>
      <PageHeader title="ダッシュボード" />
      {error ? <ErrorState message={error} /> : null}
      {!error && !stats ? <LoadingState /> : null}
      {stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="紹介者数" value={`${stats.referrerCount.toLocaleString("ja-JP")}人`} />
          <KpiCard label="公開中の案件数" value={`${stats.publishedCaseCount.toLocaleString("ja-JP")}件`} />
          <KpiCard label="今月の申込件数" value={`${stats.applicationsThisMonth.toLocaleString("ja-JP")}件`} />
          <KpiCard label="支払待ち報酬合計" value={formatYen(stats.pendingPayoutTotal)} hint="成果確定・未払いの報酬合計" />
          <KpiCard label="今月の支払済み報酬合計" value={formatYen(stats.paidThisMonthTotal)} />
        </div>
      ) : null}
    </div>
  );
}
