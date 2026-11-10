"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheckCircle, IconClose } from "@/components/icons";

// 画面を閉じる。LINEの公式ガイドでは、ページから確実に閉じられるのはLIFFブラウザ(LINEミニアプリ)
// の liff.closeWindow() だけで、LINE内ブラウザ・Safari・Chromeでは保証されない。そのため
// LIFFブラウザなら liff.closeWindow()、それ以外は window.close() を試す(許可されれば閉じる)。
// liff.isInClient() と liff.closeWindow() は liff.init() 前でも呼べるため、ログイン処理は行わない。
async function requestClose() {
  try {
    const liff = (await import("@line/liff")).default;
    if (liff.isInClient()) {
      liff.closeWindow();
      return;
    }
  } catch {
    // SDKを読み込めない場合は通常のブラウザとして扱う
  }
  window.close();
}

function CloseButton() {
  const [showHint, setShowHint] = useState(false);

  async function handleClose() {
    await requestClose();
    // 閉じられた場合は画面ごと消えるため、これ以降は表示されない。まだ画面が残っている
    // = このブラウザではページから閉じられないので、ブラウザ側の×で閉じるよう案内する。
    window.setTimeout(() => setShowHint(true), 500);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClose}
        aria-label="閉じる"
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition active:bg-surface-muted"
      >
        <IconClose className="h-6 w-6" />
      </button>
      {showHint && (
        <p
          role="status"
          className="absolute inset-x-4 top-14 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm leading-relaxed text-ink shadow-card"
        >
          お使いのブラウザでは、このボタンで画面を閉じることができません。ブラウザ上部の「×」で閉じてください。
        </p>
      )}
    </>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const count = searchParams.get("count");
  const titles = searchParams.getAll("t");
  const companies = searchParams.getAll("c");
  const items = searchParams
    .getAll("no")
    .map((no, i) => ({ no, title: titles[i] ?? "", company: companies[i] ?? "" }));
  const emailSent = searchParams.get("mail") === "1";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <CloseButton />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
        <IconCheckCircle className="h-9 w-9" />
      </div>
      <p className="text-xl font-extrabold">お申し込みありがとうございました</p>
      <p className="mt-2 text-base leading-relaxed text-ink-muted">
        {count ? `${count}件のお申し込みを受け付けました。` : "お申し込みを受け付けました。"}
        <br />
        担当企業より、順次ご連絡いたします。
      </p>
      {items.length > 0 && (
        <div className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-3 text-left">
          <p className="text-xs text-ink-muted">お申し込み内容</p>
          <ul className="mt-1 divide-y divide-border">
            {items.map(({ no, title, company }) => (
              <li key={no} className="py-2">
                {company && (
                  <p className="text-base font-bold text-ink">
                    <span className="mr-1.5 text-xs font-normal text-ink-muted">申込先</span>
                    {company}
                  </p>
                )}
                {title && <p className="text-sm text-ink-muted">{title}</p>}
                <p className="mt-1 text-xs text-ink-muted">
                  お問い合わせ番号
                  <span className="ml-1.5 text-base font-bold tracking-wider tabular-nums text-ink">{no}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            {emailSent && "ご入力のメールアドレスに受付完了メールをお送りしました。"}
            サービス内容についてのご質問は、担当企業からのご連絡の際にお尋ねください。お問い合わせ番号は、OPTASへお問い合わせいただく際にお伝えください。
          </p>
        </div>
      )}
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteContent />
    </Suspense>
  );
}
