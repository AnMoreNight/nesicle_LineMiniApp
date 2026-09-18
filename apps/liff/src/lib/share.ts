export function buildShareMessage(url: string, caseTitles: string[]): string {
  const casesText = caseTitles.length > 1 ? `${caseTitles[0]} 他${caseTitles.length - 1}件` : caseTitles[0] ?? "";
  return `【ネシクル】${casesText}のご紹介です。こちらからご確認ください。\n${url}`;
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
  const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
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
