"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import type { Liff } from "@line/liff";
import { IconExternal } from "./icons";
import clsx from "clsx";

// 外部サイト(提供会社のWebサイトなど)へのリンク。今の画面は残したまま開く。
// - LINEミニアプリ(LIFFブラウザ)内: liff.openWindow でLINE内ブラウザを重ねて開く(LINEが案内している方法)
// - それ以外のブラウザ: 新しいタブで開く
export function ExternalLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  // クリックの処理中に読み込むとブラウザがポップアップ扱いにすることがあるため、先に読み込んでおく
  const liffRef = useRef<Liff | null>(null);
  useEffect(() => {
    import("@line/liff")
      .then((m) => {
        liffRef.current = m.default;
      })
      .catch(() => {});
  }, []);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const liff = liffRef.current;
    // liff.id は liff.init() 後にだけ入る(openWindow は初期化後でないと使えない)
    if (!liff?.isInClient() || !liff.id) return;
    e.preventDefault();
    try {
      liff.openWindow({ url: href, external: false });
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={clsx("inline-flex items-start gap-1 break-all font-bold text-primary underline", className)}
    >
      {children}
      <IconExternal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    </a>
  );
}
