"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CASE_STATUS_LABEL_JA, type CaseStatus } from "@nesicle/shared";
import { api, ApiError } from "@/lib/api";
import { formatYen } from "@/lib/format";
import { CaseStatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState, PageHeader, LinkButton, Select } from "@/components/ui";
import type { CaseWithCompany } from "@/types/admin";

const STATUS_OPTIONS: CaseStatus[] = ["DRAFT", "PUBLISHED", "SUSPENDED"];

export default function CasesPage() {
  const [cases, setCases] = useState<CaseWithCompany[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (category) query.set("category", category);
    const qs = query.toString();
    setCases(null);
    api
      .get<CaseWithCompany[]>(`/api/admin/cases${qs ? `?${qs}` : ""}`)
      .then(setCases)
      .catch((err) => setError(err instanceof ApiError ? err.message : "案件一覧の取得に失敗しました。"));
  }, [status, category]);

  const categories = Array.from(new Set((cases ?? []).map((c) => c.category))).sort();

  return (
    <div>
      <PageHeader
        title="案件管理"
        actions={
          <LinkButton href="/cases/new" variant="primary">
            + 新規案件
          </LinkButton>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">すべてのステータス</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {CASE_STATUS_LABEL_JA[s]}
            </option>
          ))}
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {!error && !cases ? <LoadingState /> : null}
      {cases && cases.length === 0 ? <EmptyState message="該当する案件がありません。" /> : null}

      {cases && cases.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">案件タイトル</th>
                <th className="px-4 py-3 font-medium">掲載企業</th>
                <th className="px-4 py-3 font-medium">カテゴリ</th>
                <th className="px-4 py-3 font-medium">エリア</th>
                <th className="px-4 py-3 font-medium">報酬</th>
                <th className="px-4 py-3 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/cases/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.company.name}</td>
                  <td className="px-4 py-3">{c.category}</td>
                  <td className="px-4 py-3">{c.area}</td>
                  <td className="px-4 py-3 text-money">{c.rewardLabel || formatYen(c.rewardAmount)}</td>
                  <td className="px-4 py-3">
                    <CaseStatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
