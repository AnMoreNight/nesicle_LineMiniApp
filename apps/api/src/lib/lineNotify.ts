import { prisma } from "@nesicle/db";
import { env } from "../env.js";

/**
 * Pushes a LINE message to a referrer via the LINE Messaging API (a separate channel from LINE
 * Login — https://developers.line.biz/en/docs/messaging-api/). OPTAS isn't a daily-use service,
 * so important status changes (申込発生・成果確認・報酬確定・支払完了) are pushed here rather
 * than relying on the user to reopen the mini app.
 *
 * Until LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is configured (the client needs to create a
 * Messaging API channel in the LINE Developers console — separate from the LIFF/Login channel),
 * this safely no-ops and just logs, so every call site is already wired up and will start
 * delivering the moment the credential is added. Never throws — a failed push must not break
 * the request that triggered it.
 */
export async function notifyReferrer(userId: string, message: string): Promise<void> {
  if (!env.lineMessagingChannelAccessToken) {
    console.log(`[lineNotify] (not configured, skipped) userId=${userId}: ${message}`);
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { lineUserId: true } });
    if (!user || user.lineUserId.startsWith("dev-")) return; // dev-login users have no real LINE account to push to
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.lineMessagingChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: user.lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });
    if (!res.ok) {
      console.error(`[lineNotify] push failed (${res.status}):`, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[lineNotify] push failed:", err);
  }
}
