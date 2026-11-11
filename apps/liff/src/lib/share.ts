// 紹介を受けた方にLINE・SMSで届く文面。紹介者向けの案件名(報酬額を含む)は使わず、
// 紹介先向けのサービス名を並べて、内容を確認したくなる案内にする。
const LISTED_SERVICES = 3;

// 文面はクライアント指定のもの。サービスが1件ならサービス名だけ、複数なら「・」で並べる。
export function buildShareMessage(url: string, serviceNames: string[]): string {
  const shown = serviceNames.slice(0, LISTED_SERVICES);
  const listed = shown.length === 1 && serviceNames.length === 1 ? shown : shown.map((name) => `・${name}`);
  const rest = serviceNames.length - shown.length;
  return [
    "おすすめのサービスをご紹介します。",
    "",
    ...listed,
    ...(rest > 0 ? [`ほか${rest}件`] : []),
    "",
    "サービスの詳細は、以下のリンクからご確認ください。ご希望に合えば、そのままお申し込みいただけます。",
    url,
  ].join("\n");
}

export async function shareViaLine(url: string, message: string) {
  try {
    const liffModule = await import("@line/liff");
    const liff = liffModule.default;
    if (liff.isInClient() && liff.isApiAvailable("shareTargetPicker")) {
      await liff.shareTargetPicker([{ type: "text", text: message }]);
      return;
    }
  } catch {
    // Not running inside the LINE app / LIFF not initialized — fall back to the web share plugin.
  }
  // LINEの共有ページは url を本文の後ろに自動で付けるため、本文の末尾のURLは外す(付けたままだとURLが2回並ぶ)
  const text = message.endsWith(url) ? message.slice(0, -url.length).trimEnd() : message;
  const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareViaSms(message: string) {
  window.location.href = `sms:&body=${encodeURIComponent(message)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
