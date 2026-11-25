// LINEミニアプリは内部チャネル(本番用・審査用・開発用)ごとにLIFF IDが異なる。
// LINE Developers の［ウェブアプリ設定］で、審査用のエンドポイントURLを「https://app.optas.co.jp/?env=review」、
// 開発用を「…/?env=dev」にしておき、その値で初期化するLIFF IDを選ぶ(付いていなければ本番用)。
// LINEはエンドポイントURLのクエリをアプリを開いたURLに残すが、アプリ内の遷移やログイン後のURLの整理で
// 消えるため、同じタブの間は sessionStorage に覚えておく。
const CHANNEL_LIFF_IDS: Record<string, string | undefined> = {
  review: process.env.NEXT_PUBLIC_LIFF_ID_REVIEW,
  dev: process.env.NEXT_PUBLIC_LIFF_ID_DEV,
};
const STORAGE_KEY = "liff-env";

export function currentLiffId(): string | undefined {
  const published = process.env.NEXT_PUBLIC_LIFF_ID || undefined;
  if (typeof window === "undefined") return published;
  let channel = new URLSearchParams(window.location.search).get("env");
  try {
    if (channel && CHANNEL_LIFF_IDS[channel]) sessionStorage.setItem(STORAGE_KEY, channel);
    else channel = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // sessionStorage が使えない場合は、URLにある値だけで決める
  }
  return (channel && CHANNEL_LIFF_IDS[channel]) || published;
}
