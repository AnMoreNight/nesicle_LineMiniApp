/**
 * Verifies a LINE ID token (obtained client-side via `liff.getIDToken()`) against
 * LINE's token verification endpoint. LINE_LOGIN_CHANNEL_ID lists the channel IDs whose
 * tokens are accepted; until it is set this path is unused locally (dev login covers
 * local development instead).
 */
export interface VerifiedLineProfile {
  sub: string;
  name?: string;
  picture?: string;
}

/** IDトークン(JWT)の発行先チャネルID(aud)。署名・有効期限・発行先の検証はLINEの検証APIで行う */
function audienceOf(idToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      aud?: unknown;
    };
    return typeof payload.aud === "string" ? payload.aud : null;
  } catch {
    return null;
  }
}

export async function verifyLineIdToken(idToken: string, channelIds: string[]): Promise<VerifiedLineProfile> {
  // LINEミニアプリは内部チャネル(本番用・審査用・開発用)ごとにチャネルIDが異なる。トークンの発行先が
  // 受け付けるチャネルのどれかであることを確かめてから、そのチャネルIDで検証する
  // (検証APIは、トークンの発行先が client_id と一致しなければ失敗する)。
  const channelId = audienceOf(idToken);
  if (!channelId || !channelIds.includes(channelId)) {
    throw new Error(`LINE ID token was issued for an unexpected channel (${channelId ?? "unknown"})`);
  }

  const res = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LINE ID token verification failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { sub: string; name?: string; picture?: string };
  return { sub: data.sub, name: data.name, picture: data.picture };
}
