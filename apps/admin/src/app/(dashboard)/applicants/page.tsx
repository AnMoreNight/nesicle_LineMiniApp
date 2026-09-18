"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, apiUrl, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { EmptyState, ErrorState, LinkButton, LoadingState, PageHeader } from "@/components/ui";
import type { ApplicantDetail } from "@/types/admin";

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<ApplicantDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApplicantDetail[]>("/api/admin/applicants")
      .then(setApplicants)
      .catch((err) => setError(err instanceof ApiError ? err.message : "応募者一覧の取得に失敗しました。"));
  }, []);

  return (
    <div>
      <PageHeader
        title="応募者"
        actions={<LinkButton href={apiUrl("/api/admin/applicants/export.csv")}>CSVエクスポート</LinkButton>}
      />

      {error ? <ErrorState message={error} /> : null}
      {!error && !applicants ? <LoadingState /> : null}
      {applicants && applicants.length === 0 ? <EmptyState message="登録された応募者がいません。" /> : null}

      {applicants && applicants.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">氏名</th>
                <th className="px-4 py-3 font-medium">連絡先</th>
                <th className="px-4 py-3 font-medium">住所</th>
                <th className="px-4 py-3 font-medium">申込件数</th>
                <th className="px-4 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/applicants/${a.id}`} className="font-medium text-primary hover:underline">
                      {a.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{a.email || "-"}</div>
                    <div className="text-ink-muted">{a.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3">{a.address || "-"}</td>
                  <td className="px-4 py-3">{a.applications.length}</td>
                  <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
