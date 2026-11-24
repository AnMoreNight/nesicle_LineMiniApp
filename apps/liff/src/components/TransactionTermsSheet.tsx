"use client";

import type { ReferralLinkDto } from "@nesicle/shared";
import { TRANSACTION_TERMS } from "@/lib/transactionTerms";

const dateJa = (iso: string) =>
  new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" });

const yen = (n: number) => `${n.toLocaleString("ja-JP")}円`;

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

// 項目の中の小見出し(例: ⑦の「報酬の額」「支払期日」)
function Sub({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-xs font-bold text-ink">{children}</p>;
}

// 紹介URLごとの取引条件(フリーランス法 第3条に基づく明示)。発行済みの紹介URLの「詳細」から開く。
// 見出しは公正取引委員会のパンフレット p.8「明示しなければならない事項」①〜⑧ と同じにしている。
export function TransactionTermsSheet({ link, onClose }: { link: ReferralLinkDto; onClose: () => void }) {
  const cases = link.cases ?? [];
  const multi = cases.length > 1;
  const issuedOn = dateJa(link.createdAt);

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
            紹介URLを削除するとこの画面は表示できなくなるため、スクリーンショット等で保存してください。
          </p>

          <div className="mt-3">
            <Item no="①" label="業務委託事業者および特定受託事業者の名称">
              <p>業務委託事業者（委託者）: {TRANSACTION_TERMS.clientName}</p>
              <p>特定受託事業者（受託者）: {link.referrerName || "ご利用者"} 様</p>
            </Item>

            <Item no="②" label="業務委託をした日">
              <p>{issuedOn}（この紹介URLを発行した日）</p>
            </Item>

            <Item no="③" label="特定受託事業者の給付の内容">
              <p>この紹介URLを通じて、下記の案件のサービスを第三者に紹介する業務</p>
              <p>
                紹介した方がこの紹介URLからお申し込みのうえ、案件ごとの条件を満たしたものを、紹介1件の成果とします（紹介件数の上限はありません）。
              </p>
              {cases.map((c) => (
                <div key={c.id} className="space-y-0.5 rounded-md bg-surface-muted px-3 py-2">
                  <p className="font-bold">{c.title}</p>
                  <p className="text-xs text-ink-muted">掲載企業: {c.companyName}</p>
                  {c.eligibilityNotes && <p className="text-xs">対象となる方: {c.eligibilityNotes}</p>}
                  {c.ineligibleNotes && <p className="text-xs">対象外となる場合: {c.ineligibleNotes}</p>}
                  {c.rewardTimingNotes && <p className="text-xs">成果（報酬が確定する条件）: {c.rewardTimingNotes}</p>}
                </div>
              ))}
            </Item>

            <Item no="④" label="給付を受領または役務の提供を受ける期日">
              <p>
                {issuedOn}から、{TRANSACTION_TERMS.servicePeriodEnd}
              </p>
            </Item>

            <Item no="⑤" label="給付を受領または役務の提供を受ける場所">
              <p>{TRANSACTION_TERMS.servicePlace}</p>
            </Item>

            <Item no="⑥" label="給付の内容について検査する場合は、検査を完了する期日">
              <p>{TRANSACTION_TERMS.inspectionDeadline}</p>
            </Item>

            <Item no="⑦" label="報酬の額および支払期日">
              <Sub>報酬の額（成果1件につき）</Sub>
              {cases.map((c) => (
                <p key={c.id}>
                  {multi && <span className="font-bold">{c.title}: </span>}
                  {yen(c.rewardAmount)}（{TRANSACTION_TERMS.rewardTax}）
                </p>
              ))}
              <Sub>支払期日</Sub>
              <p>{TRANSACTION_TERMS.paymentDue}</p>
            </Item>

            <Item no="⑧" label="金銭以外の方法で報酬を支払う場合は、支払方法に関すること">
              <p>{TRANSACTION_TERMS.paymentMethod}</p>
              <p>{TRANSACTION_TERMS.transferFee}</p>
            </Item>
          </div>
        </div>
      </div>
    </div>
  );
}
