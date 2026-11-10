"use client";

import { Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheckCircle, IconClose } from "@/components/icons";

// LINEのトークのリンクから開く「LINE内ブラウザ」か(LIFFブラウザ=LINEミニアプリとは別物)。
// LINE内ブラウザのUser-Agentには "Line/バージョン" が入り、LIFFブラウザにはさらに "LIFF" が入る。
function isLineInAppBrowser() {
  const ua = navigator.userAgent;
  return /\bLine\//i.test(ua) && !/LIFF/i.test(ua);
}

// ×ボタン: 申込完了画面を閉じる。上から順に試す。
// 1. LINEミニアプリ(LIFFブラウザ): liff.closeWindow()。LINEが動作を保証している方法。
//    liff.isInClient()・liff.closeWindow() は liff.init() 前でも呼べるので、ログイン処理は行わない。
// 2. Chrome・Safari・LINE内ブラウザなど: window.close()。ブラウザは「スクリプトで開いたウィンドウ」か
//    「履歴が1件だけのタブ」に限り、ページ自身が閉じることを許可する。紹介ページ→申込→完了は
//    router.replace で遷移して履歴を1件に保っているため、紹介リンクから開いたタブならここで閉じる。
// 3. それでも画面が残っている場合(ブラウザが拒否した・アプリが未対応)は、案内文は出さずに画面を離れる。
//    LINE内ブラウザ → LINEのトーク一覧を開く(https://line.me/R/nv/chat はLINEアプリが処理する)
//    その他のブラウザ → 紹介リンクを開く前のページに戻る(同じタブで別のページから来た場合)
async function closeScreen() {
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
  window.setTimeout(() => {
    // 閉じられた場合、このタイマーは実行されない(または画面が非表示になっている)
    if (document.visibilityState !== "visible") return;
    if (isLineInAppBrowser()) {
      window.location.href = "https://line.me/R/nv/chat";
    } else {
      window.history.back();
    }
  }, 400);
}

function CloseButton() {
  const lastTap = useRef(0);

  function handleClick() {
    // 連打で2ページ以上戻らないようにする
    const now = Date.now();
    if (now - lastTap.current < 1500) return;
    lastTap.current = now;
    void closeScreen();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="閉じる"
      className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition active:bg-surface-muted"
    >
      <IconClose className="h-6 w-6" />
    </button>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const count = searchParams.get("count");
  const titles = searchParams.getAll("t");
  const companies = searchParams.getAll("c");
  const already = searchParams.getAll("d");
  const items = searchParams
    .getAll("no")
    .map((no, i) => ({ no, title: titles[i] ?? "", company: companies[i] ?? "", alreadyApplied: already[i] === "1" }));
  const emailSent = searchParams.get("mail") === "1";
  // 選んだサービスがすべて、以前のお申し込みで対応中だった(今回は新しい申込なし)
  const allAlreadyApplied = items.length > 0 && items.every((it) => it.alreadyApplied);

  return (
    <div className="relative flex min-h-viewport flex-col items-center justify-center px-6 text-center">
      <CloseButton />
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
        <IconCheckCircle className="h-9 w-9" />
      </div>
      {allAlreadyApplied ? (
        <>
          <p className="text-xl font-extrabold">すでにお申し込み済みです</p>
          <p className="mt-2 text-base leading-relaxed text-ink-muted">
            以前のお申し込みを受け付けています。
            <br />
            担当企業からのご連絡をお待ちください。
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-extrabold">お申し込みありがとうございました</p>
          <p className="mt-2 text-base leading-relaxed text-ink-muted">
            {count ? `${count}件のお申し込みを受け付けました。` : "お申し込みを受け付けました。"}
            <br />
            担当企業より、順次ご連絡いたします。
          </p>
        </>
      )}
      {items.length > 0 && (
        <div className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-3 text-left">
          <p className="text-xs text-ink-muted">お申し込み内容</p>
          <ul className="mt-1 divide-y divide-border">
            {items.map(({ no, title, company, alreadyApplied }) => (
              <li key={no} className="py-2">
                {alreadyApplied && (
                  <span className="mb-1 inline-block rounded-sm bg-surface-muted px-1.5 py-0.5 text-xs font-bold text-ink-muted">
                    以前にお申し込み済み
                  </span>
                )}
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
