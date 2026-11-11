"use client";

import { useCallback, useState } from "react";

export type LegalDoc = "terms" | "privacy";
type Viewed = Record<LegalDoc, boolean>;

function read(key: string): Viewed {
  if (typeof window === "undefined") return { terms: false, privacy: false };
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? "{}");
    return { terms: v.terms === true, privacy: v.privacy === true };
  } catch {
    return { terms: false, privacy: false };
  }
}

/**
 * 利用規約・プライバシーポリシーを開いたかどうか。両方を開くまで「同意します」にチェックできないようにする。
 * タブ単位(sessionStorage)で保存するので、同じ画面でページを開くアプリ内ブラウザ(LINE等)で戻ってきても残る。
 */
export function useViewedDocs(key: string) {
  const [viewed, setViewed] = useState<Viewed>(() => read(key));

  const markViewed = useCallback(
    (doc: LegalDoc) => {
      // リンク先へ移動する前に確実に残すため、保存はここで同期的に行う
      const next = { ...read(key), [doc]: true };
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage unavailable: still counts for this page view
      }
      setViewed(next);
    },
    [key],
  );

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // nothing to clear
    }
  }, [key]);

  return { viewed, bothViewed: viewed.terms && viewed.privacy, markViewed, clear };
}
