import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.API_PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET", "dev-only-change-me-referrer-jwt-secret"),
  adminJwtSecret: required("ADMIN_JWT_SECRET", "dev-only-change-me-admin-jwt-secret"),
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === "true",
  lineLoginChannelId: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
  // LINE Messaging API (LINEログインとは別チャネル。ステータス変更のプッシュ通知用)。
  // 未設定の間は notifyReferrer が黙ってno-opする — クライアントがチャネルを用意し次第、
  // 環境変数を設定するだけで動き出す。
  lineMessagingChannelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ?? "",
  publicLiffAppUrl: process.env.PUBLIC_LIFF_APP_URL ?? "http://localhost:3000",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
  crossSiteCookies: process.env.COOKIE_CROSS_SITE === "true",
};
