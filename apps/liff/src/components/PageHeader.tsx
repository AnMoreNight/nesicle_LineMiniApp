"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "./icons";

export function PageHeader({
  title,
  onBack,
  closeIfNoHistory = false,
}: {
  title: string;
  onBack?: () => void;
  // 利用規約・プライバシーポリシー用: 申込フォームから新しいタブで開かれた(戻る先の履歴がない)場合は、
  // 戻るボタンでそのタブを閉じて申込フォームのタブに戻る。
  closeIfNoHistory?: boolean;
}) {
  const router = useRouter();

  function goBack() {
    if (onBack) return onBack();
    if (closeIfNoHistory && window.history.length <= 1) {
      window.close();
      // 閉じられなかった場合(アプリ内ブラウザ等)は、このページを開いた元のページ(申込フォーム)へ戻る
      window.setTimeout(() => {
        if (document.visibilityState !== "visible") return;
        const from = document.referrer;
        if (from && new URL(from).origin === window.location.origin) window.location.href = from;
      }, 400);
      return;
    }
    router.back();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-4 py-3.5">
      <button
        type="button"
        onClick={goBack}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-surface-muted"
        aria-label="戻る"
      >
        <IconBack className="h-5 w-5" />
      </button>
      <p className="text-lg font-bold">{title}</p>
    </header>
  );
}
