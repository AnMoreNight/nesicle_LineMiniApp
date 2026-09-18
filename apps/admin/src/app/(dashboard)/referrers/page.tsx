"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, apiUrl, ApiError } from "@/lib/api";
import { formatDate, formatYen } from "@/lib/format";
import { BoolBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/ui";
import type { ReferrerListItem } from "@/types/admin";

export default function ReferrersPage() {
  const [referrers, setReferrers] = useState<ReferrerListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ReferrerListItem[]>("/api/admin/referrers")
      .then(setReferrers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "紹介者一覧の取得に失敗しました。"));
  }, []);

  return (
    <div>
      <PageHeader
        title="紹介者"
        actions={
          <LinkButton href={apiUrl("/api/admin/referrers/export.csv")}>CSVエクスポート</LinkButton>
        }
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && !referrers ? <LoadingState /> : null}
      {referrers && referrers.length === 0 ? <EmptyState message="登録された紹介者がいません。" /> : null}

      {referrers && referrers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">LINE表示名</th>
                <th className="px-4 py-3 font-medium">氏名</th>
                <th className="px-4 py-3 font-medium">連絡先</th>
                <th className="px-4 py-3 font-medium">口座登録</th>
                <th className="px-4 py-3 font-medium">紹介URL数</th>
                <th className="px-4 py-3 font-medium">申込件数</th>
                <th className="px-4 py-3 font-medium">確定報酬</th>
                <th className="px-4 py-3 font-medium">支払済み報酬</th>
                <th className="px-4 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/referrers/${r.id}`} className="font-medium text-primary hover:underline">
                      {r.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.fullName || "-"}</td>
                  <td className="px-4 py-3">
                    <div>{r.email || "-"}</div>
                    <div className="text-ink-muted">{r.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <BoolBadge value={r.hasBankAccount} trueLabel="登録済み" falseLabel="未登録" />
                  </td>
                  <td className="px-4 py-3">{r.linkCount}</td>
                  <td className="px-4 py-3">{r.applicationCount}</td>
                  <td className="px-4 py-3 text-money">{formatYen(r.confirmedTotal)}</td>
                  <td className="px-4 py-3 text-money">{formatYen(r.paidTotal)}</td>
                  <td className="px-4 py-3">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
