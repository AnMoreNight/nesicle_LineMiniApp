"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatYen } from "@/lib/format";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { ProgressStatusBadge, RewardStatusBadge } from "@/components/StatusBadge";
import type { ApplicantDetail } from "@/types/admin";

export default function ApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const applicantId = params.id;

  const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ApplicantDetail>(`/api/admin/applicants/${applicantId}`)
      .then(setApplicant)
      .catch((err) => setError(err instanceof ApiError ? err.message : "応募者情報の取得に失敗しました。"));
  }, [applicantId]);

  if (error) {
    return (
      <div>
        <PageHeader title="応募者詳細" />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!applicant) {
    return (
      <div>
        <PageHeader title="応募者詳細" />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={applicant.fullName} />

      <Card className="max-w-xl">
        <h2 className="mb-4 text-base font-bold text-ink">応募者情報</h2>
        <dl className="space-y-2 text-sm">
          <Row label="氏名" value={applicant.fullName} />
          <Row label="生年月日" value={formatDate(applicant.birthDate)} />
          <Row label="電話番号" value={applicant.phone || "-"} />
          <Row label="メール" value={applicant.email || "-"} />
          <Row label="郵便番号" value={applicant.postalCode || "-"} />
          <Row label="住所" value={applicant.address || "-"} />
          <Row label="申込日" value={formatDate(applicant.createdAt)} />
        </dl>
        {applicant.notes ? (
          <p className="mt-4 whitespace-pre-wrap rounded-sm bg-surface-muted p-3 text-sm text-ink">{applicant.notes}</p>
        ) : null}
      </Card>

      <div>
        <h2 className="mb-3 text-base font-bold text-ink">申込一覧（{applicant.applications.length}件）</h2>
        {applicant.applications.length === 0 ? (
          <EmptyState message="申込がありません。" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                  <th className="px-4 py-3 font-medium">案件</th>
                  <th className="px-4 py-3 font-medium">紹介者</th>
                  <th className="px-4 py-3 font-medium">進捗</th>
                  <th className="px-4 py-3 font-medium">報酬状況</th>
                  <th className="px-4 py-3 font-medium">報酬額</th>
                  <th className="px-4 py-3 font-medium">申込日</th>
                </tr>
              </thead>
              <tbody>
                {applicant.applications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/cases/${a.case.id}`} className="font-medium text-primary hover:underline">
                        {a.case.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/referrers/${a.referralLink.referrer.id}`}
                        className="text-primary hover:underline"
                      >
                        {a.referralLink.referrer.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ProgressStatusBadge status={a.progressStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <RewardStatusBadge status={a.rewardStatus} />
                    </td>
                    <td className="px-4 py-3 text-money">{formatYen(a.rewardAmount)}</td>
                    <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
