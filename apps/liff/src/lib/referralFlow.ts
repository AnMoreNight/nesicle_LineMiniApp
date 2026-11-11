"use client";

// 紹介ページ ⇄ 登録画面を行き来しても、選んだサービスと「登録が済んだところ」を引き継ぐ(タブ単位)。
// はじめての方: 紹介ページでサービスを選ぶ → 登録 → 紹介ページに戻ると、選んだまま申込の確認が開く。

const selectionKey = (code: string) => `landing-selection:${code}`;
const registeredKey = (code: string) => `just-registered:${code}`;

function get(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // storage unavailable: the flow still works, it just starts fresh after leaving the page
  }
}

export function readSelection(code: string): string[] | null {
  try {
    const v = JSON.parse(get(selectionKey(code)) ?? "null");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

export const saveSelection = (code: string, ids: string[]) => set(selectionKey(code), JSON.stringify(ids));
export const clearSelection = (code: string) => set(selectionKey(code), null);

export type RegisteredKind = "new" | "edit";

/** 登録(または登録内容の変更)が済んだ印。紹介ページに戻ったときに一度だけ読み、申込の確認を開く。 */
export const markJustRegistered = (code: string, kind: RegisteredKind) => set(registeredKey(code), kind);

export function consumeJustRegistered(code: string): RegisteredKind | null {
  const v = get(registeredKey(code));
  if (v !== "new" && v !== "edit") return null;
  set(registeredKey(code), null);
  return v;
}
