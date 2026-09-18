"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BANK_ACCOUNT_TYPE_LABEL_JA } from "@nesicle/shared";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatYen } from "@/lib/format";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { ProgressStatusBadge, RewardStatusBadge } from "@/components/StatusBadge";
import type { ReferrerDetail } from "@/types/admin";

export default function ReferrerDetailPage() {
  const params = useParams<{ id: string }>();
  const referrerId = params.id;

  const [referrer, setReferrer] = useState<ReferrerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ReferrerDetail>(`/api/admin/referrers/${referrerId}`)
      .then(setReferrer)
      .catch((err) => setError(err instanceof ApiError ? err.message : "紹介者情報の取得に失敗しました。"));
  }, [referrerId]);

  if (error) {
    return (
      <div>
        <PageHeader title="紹介者詳細" />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!referrer) {
    return (
      <div>
        <PageHeader title="紹介者詳細" />
        <LoadingState />
      </div>
    );
  }

  const profile = referrer.referrerProfile;
  const bankAccount = profile?.bankAccount ?? null;
  const allApplications = referrer.referralLinks.flatMap((link) =>
    link.applications.map((a) => ({ ...a, linkCode: link.code })),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={referrer.displayName} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-bold text-ink">プロフィール</h2>
          <dl className="space-y-2 text-sm">
            <Row label="LINE表示名" value={referrer.displayName} />
            <Row label="氏名" value={profile?.fullName || "-"} />
            <Row label="電話番号" value={profile?.phone || "-"} />
            <Row label="メール" value={profile?.email || "-"} />
            <Row label="郵便番号" value={profile?.postalCode || "-"} />
            <Row label="住所" value={profile?.address || "-"} />
            <Row label="登録日" value={formatDate(referrer.createdAt)} />
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-bold text-ink">振込先口座</h2>
          {bankAccount ? (
            <dl className="space-y-2 text-sm">
              <Row label="銀行名" value={bankAccount.bankName} />
              <Row label="支店名" value={bankAccount.branchName} />
              <Row label="口座種別" value={BANK_ACCOUNT_TYPE_LABEL_JA[bankAccount.accountType]} />
              <Row label="口座番号" value={bankAccount.accountNumber} />
              <Row label="口座名義" value={bankAccount.accountHolder} />
            </dl>
          ) : (
            <p className="text-sm text-ink-muted">口座情報は未登録です。</p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-ink">紹介URL（{referrer.referralLinks.length}件）</h2>
        {referrer.referralLinks.length === 0 ? (
          <EmptyState message="発行された紹介URLがありません。" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                  <th className="px-4 py-3 font-medium">コード</th>
                  <th className="px-4 py-3 font-medium">対象案件</th>
                  <th className="px-4 py-3 font-medium">発行日</th>
                </tr>
              </thead>
              <tbody>
                {referrer.referralLinks.map((link) => (
                  <tr key={link.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono">{link.code}</td>
                    <td className="px-4 py-3">
                      {link.cases.map((rc) => rc.case.title).join(" / ") || "-"}
                    </td>
                    <td className="px-4 py-3">{formatDate(link.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-ink">申込一覧（{allApplications.length}件）</h2>
        {allApplications.length === 0 ? (
          <EmptyState message="この紹介者経由の申込はまだありません。" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                  <th className="px-4 py-3 font-medium">申込者</th>
                  <th className="px-4 py-3 font-medium">案件</th>
                  <th className="px-4 py-3 font-medium">進捗</th>
                  <th className="px-4 py-3 font-medium">報酬状況</th>
                  <th className="px-4 py-3 font-medium">報酬額</th>
                  <th className="px-4 py-3 font-medium">申込日</th>
                </tr>
              </thead>
              <tbody>
                {allApplications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/applicants/${a.applicant.id}`} className="font-medium text-primary hover:underline">
                        {a.applicant.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{a.case.title}</td>
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
