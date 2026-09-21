import { api } from "./api";

export async function initLiff() {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return null;
  const liffModule = await import("@line/liff");
  const liff = liffModule.default;
  await liff.init({ liffId });
  return liff;
}

/**
 * LINE's OAuth redirect lands wherever the LIFF app's registered Endpoint URL points (in
 * practice, the site root "/"), NOT necessarily the page that initiated liff.login(). If we
 * only tried to complete the login on the /login page, a landing on any other page would hit
 * that page's own "not logged in" guard first, which redirects to /login and drops the
 * returned auth code/state from the URL before it's ever read — an infinite-looking loop even
 * though LINE's side succeeded. Calling this once, globally, before the first session check
 * (regardless of which page we land on) fixes that. Safe/idempotent to call on every page load:
 * it only does anything if the LIFF SDK reports we're already logged in.
 */
export async function completeLiffLoginIfPossible(): Promise<boolean> {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) return false;

  const liff = await initLiff();
  if (!liff || !liff.isLoggedIn()) return false;

  const idToken = liff.getIDToken();
  if (!idToken) return false;

  const profile = await liff.getProfile();
  await api.post("/api/auth/liff-login", {
    idToken,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  });

  // Drop LINE's callback params (code=, state=, liffClientId=, liffRedirectUri=) now that
  // they've been consumed, so a later reload on this same URL doesn't try to reuse a spent code.
  window.history.replaceState({}, "", window.location.pathname);
  return true;
}
