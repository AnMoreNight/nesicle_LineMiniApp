"use client";

import type { ReferralLinkDto } from "@nesicle/shared";
import { TRANSACTION_TERMS } from "@/lib/transactionTerms";

const dateJa = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });

function Item({ no, label, children }: { no: string; label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <p className="text-xs font-bold text-ink-muted">
        {no} {label}
      </p>
      <div className="mt-1 space-y-1 text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}

// 紹介URLごとの取引条件(フリーランス法 第3条に基づく明示)。発行済みの紹介URLの「詳細」から開く。
export function TransactionTermsSheet({ link, onClose }: { link: ReferralLinkDto; onClose: () => void }) {
  const cases = link.cases ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="取引条件"
        className="max-h-[85vh] w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-t-lg bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <p className="text-lg font-bold">取引条件</p>
          <button type="button" onClick={onClose} className="text-sm font-bold text-primary">
            閉じる
          </button>
        </div>
        <div className="px-5 pb-8 pt-3">
          <p className="text-xs leading-relaxed text-ink-muted">
            この紹介URLによる紹介業務の取引条件です（特定受託事業者に係る取引の適正化等に関する法律 第3条に基づく明示）。
            必要に応じて、スクリーンショット等で保存してください。
          </p>

          <div className="mt-3">
            <Item no="①" label="委託者・受託者の名称">
              <p>委託者: {TRANSACTION_TERMS.clientName}</p>
              <p>受託者: {link.referrerName || "ご利用者"} 様</p>
            </Item>
            <Item no="②" label="業務委託をした日">
              <p>{dateJa(link.createdAt)}（この紹介URLを発行した日）</p>
            </Item>
            <Item no="③" label="業務の内容">
              <p>この紹介URLを通じて、次の案件のサービスを第三者に紹介する業務</p>
              {cases.map((c) => (
                <div key={c.id} className="rounded-md bg-surface-muted px-3 py-2">
                  <p className="font-bold">{c.title}</p>
                  <p className="text-xs text-ink-muted">掲載企業: {c.companyName}</p>
                  {c.eligibilityNotes && <p className="mt-1 text-xs">成果の条件: {c.eligibilityNotes}</p>}
                  {c.ineligibleNotes && <p className="text-xs">対象外となる場合: {c.ineligibleNotes}</p>}
                </div>
              ))}
            </Item>
            <Item no="④" label="役務の提供を受ける期日">
              <p>{TRANSACTION_TERMS.servicePeriod}</p>
            </Item>
            <Item no="⑤" label="役務の提供を受ける場所">
              <p>{TRANSACTION_TERMS.servicePlace}</p>
            </Item>
            <Item no="⑥" label="成果確認（検査）を完了する期日">
              {cases.some((c) => c.rewardTimingNotes) ? (
                cases.map((c) => (
                  <p key={c.id}>
                    {cases.length > 1 && <span className="font-bold">{c.title}: </span>}
                    {c.rewardTimingNotes || TRANSACTION_TERMS.inspection}
                  </p>
                ))
              ) : (
                <p>{TRANSACTION_TERMS.inspection}</p>
              )}
            </Item>
            <Item no="⑦" label="報酬の額および支払期日">
              {cases.map((c) => (
                <p key={c.id}>
                  {cases.length > 1 && <span className="font-bold">{c.title}: </span>}
                  {c.rewardLabel}（紹介1件・成果確定ごと）
                </p>
              ))}
              <p>支払期日: {TRANSACTION_TERMS.paymentDue}</p>
            </Item>
            <Item no="⑧" label="支払方法">
              <p>{TRANSACTION_TERMS.paymentMethod}</p>
            </Item>
          </div>
        </div>
      </div>
    </div>
  );
}
