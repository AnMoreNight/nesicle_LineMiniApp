"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/ui";
import type { CompanyListItem } from "@/types/admin";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CompanyListItem[]>("/api/admin/companies")
      .then(setCompanies)
      .catch((err) => setError(err instanceof ApiError ? err.message : "掲載企業一覧の取得に失敗しました。"));
  }, []);

  return (
    <div>
      <PageHeader
        title="掲載企業"
        actions={
          <LinkButton href="/companies/new" variant="primary">
            + 新規企業
          </LinkButton>
        }
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && !companies ? <LoadingState /> : null}
      {companies && companies.length === 0 ? <EmptyState message="登録された掲載企業がありません。" /> : null}

      {companies && companies.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">企業名</th>
                <th className="px-4 py-3 font-medium">担当者</th>
                <th className="px-4 py-3 font-medium">連絡先</th>
                <th className="px-4 py-3 font-medium">案件数</th>
                <th className="px-4 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.contactName || "-"}</td>
                  <td className="px-4 py-3">
                    <div>{c.contactEmail || "-"}</div>
                    <div className="text-ink-muted">{c.contactPhone || ""}</div>
                  </td>
                  <td className="px-4 py-3">{c.caseCount}</td>
                  <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
