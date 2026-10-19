"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BANK_ACCOUNT_TYPE_LABEL_JA, PAYOUT_REQUEST_STATUS_LABEL_JA, PAYOUT_METHOD_LABEL_JA } from "@nesicle/shared";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatYen } from "@/lib/format";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import type { PayoutRequestListItem } from "@/types/admin";

export default function PayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequestListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  function load() {
    setError(null);
    api
      .get<PayoutRequestListItem[]>("/api/admin/payout-requests")
      .then(setRequests)
      .catch((err) => setError(err instanceof ApiError ? err.message : "振込申請一覧の取得に失敗しました。"));
  }

  useEffect(load, []);

  async function handlePay(id: string) {
    if (!window.confirm("この振込申請を支払済みにしますか?紐づく申込の報酬状況も「支払済み」になります。")) return;
    setPayingId(id);
    setError(null);
    try {
      await api.post(`/api/admin/payout-requests/${id}/pay`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "更新に失敗しました。");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div>
      <PageHeader title="振込申請" />

      {error ? <ErrorState message={error} /> : null}
      {!error && !requests ? <LoadingState /> : null}
      {requests && requests.length === 0 ? <EmptyState message="振込申請はまだありません。" /> : null}

      {requests && requests.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">紹介者</th>
                <th className="px-4 py-3 font-medium">金額</th>
                <th className="px-4 py-3 font-medium">受取方法</th>
                <th className="px-4 py-3 font-medium">振込先</th>
                <th className="px-4 py-3 font-medium">対象申込</th>
                <th className="px-4 py-3 font-medium">状態</th>
                <th className="px-4 py-3 font-medium">申請日</th>
                <th className="px-4 py-3 font-medium">支払日</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/referrers/${r.user.id}`} className="font-medium text-primary hover:underline">
                      {r.user.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-money">{formatYen(r.amount)}</td>
                  <td className="px-4 py-3">{PAYOUT_METHOD_LABEL_JA[r.method]}</td>
                  <td className="px-4 py-3">
                    <Destination request={r} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.applications.map((a) => a.case.title).join(" / ")}
                  </td>
                  <td className="px-4 py-3">{PAYOUT_REQUEST_STATUS_LABEL_JA[r.status]}</td>
                  <td className="px-4 py-3">{formatDate(r.requestedAt)}</td>
                  <td className="px-4 py-3">{r.paidAt ? formatDateTime(r.paidAt) : "-"}</td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <Button onClick={() => handlePay(r.id)} disabled={payingId === r.id}>
                        {payingId === r.id ? "処理中..." : "支払済みにする"}
                      </Button>
                    ) : null}
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

// 受取方法ごとの受取先表示。PayPayポイント等を追加するときはここに分岐を足す。
function Destination({ request }: { request: PayoutRequestListItem }) {
  if (request.method === "BANK_TRANSFER") {
    const bank = request.user.referrerProfile?.bankAccount;
    if (!bank) return <span className="text-danger">口座未登録</span>;
    return (
      <div className="leading-relaxed">
        <div>
          {bank.bankName} {bank.branchName}
        </div>
        <div className="text-ink-muted">
          {BANK_ACCOUNT_TYPE_LABEL_JA[bank.accountType]} {bank.accountNumber} / {bank.accountHolder}
        </div>
      </div>
    );
  }
  return <span className="text-ink-muted">-</span>;
}
