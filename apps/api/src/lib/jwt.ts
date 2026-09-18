import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface ReferrerTokenPayload {
  userId: string;
}

export interface AdminTokenPayload {
  adminId: string;
}

export const REFERRER_COOKIE = "nesicle_session";
export const ADMIN_COOKIE = "nesicle_admin_session";

/**
 * When the frontend and API are served from different origins (e.g. two separate ngrok
 * tunnels, or separate production domains), the cookie has to be SameSite=None + Secure or
 * browsers won't send it back on cross-site fetch/XHR calls (SameSite=Lax only allows
 * top-level navigations cross-site). For same-origin-ish local dev (localhost:3000 calling
 * localhost:4000) Lax + non-Secure is required instead, since Secure cookies are dropped over
 * plain HTTP. `crossSite` is passed per-caller rather than read globally, since the admin
 * console is normally still plain localhost (same-site) even while the LIFF app is tunneled.
 */
export function cookieOptions(maxAgeSeconds: number, crossSite: boolean) {
  return crossSite
    ? { httpOnly: true, sameSite: "none" as const, secure: true, path: "/", maxAge: maxAgeSeconds }
    : { httpOnly: true, sameSite: "lax" as const, secure: false, path: "/", maxAge: maxAgeSeconds };
}

export function signReferrerToken(payload: ReferrerTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyReferrerToken(token: string): ReferrerTokenPayload {
  return jwt.verify(token, env.jwtSecret) as ReferrerTokenPayload;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtSecret, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, env.adminJwtSecret) as AdminTokenPayload;
}
