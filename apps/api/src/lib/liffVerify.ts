/**
 * Verifies a LINE ID token (obtained client-side via `liff.getIDToken()`) against
 * LINE's token verification endpoint. Requires LINE_LOGIN_CHANNEL_ID to be set to the
 * real LINE Login channel ID once production LIFF credentials are available — until
 * then this path is unused locally (dev login covers local development instead).
 */
export interface VerifiedLineProfile {
  sub: string;
  name?: string;
  picture?: string;
}

export async function verifyLineIdToken(idToken: string, channelId: string): Promise<VerifiedLineProfile> {
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
