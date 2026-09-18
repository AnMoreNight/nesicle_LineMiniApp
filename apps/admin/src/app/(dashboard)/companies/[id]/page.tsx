"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatYen } from "@/lib/format";
import { Card, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { CaseStatusBadge } from "@/components/StatusBadge";
import { CompanyForm } from "@/components/CompanyForm";
import type { CompanyBase, CompanyDetail, CompanyInput } from "@/types/admin";

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CompanyDetail>(`/api/admin/companies/${companyId}`)
      .then(setCompany)
      .catch((err) => setError(err instanceof ApiError ? err.message : "企業情報の取得に失敗しました。"));
  }, [companyId]);

  // PUT returns the bare Company row (no `cases` include — only the initial GET includes
  // it), so merge onto the previously loaded company instead of replacing it.
  async function handleSubmit(input: CompanyInput) {
    const updated = await api.put<CompanyBase>(`/api/admin/companies/${companyId}`, input);
    setCompany((prev) => (prev ? { ...prev, ...updated } : (updated as CompanyDetail)));
  }

  if (error) {
    return (
      <div>
        <PageHeader title="企業詳細" />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <PageHeader title="企業詳細" />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={company.name} />

      <Card className="max-w-xl">
        <CompanyForm initial={company} submitLabel="変更を保存" onSubmit={handleSubmit} />
      </Card>

      <div>
        <h2 className="mb-3 text-base font-bold text-ink">掲載案件（{company.cases.length}件）</h2>
        {company.cases.length === 0 ? (
          <p className="text-sm text-ink-muted">この企業に紐づく案件はまだありません。</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                  <th className="px-4 py-3 font-medium">案件タイトル</th>
                  <th className="px-4 py-3 font-medium">カテゴリ</th>
                  <th className="px-4 py-3 font-medium">報酬</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {company.cases.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                    <td className="px-4 py-3">
                      <Link href={`/cases/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.category}</td>
                    <td className="px-4 py-3 text-money">{c.rewardLabel || formatYen(c.rewardAmount)}</td>
                    <td className="px-4 py-3">
                      <CaseStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
