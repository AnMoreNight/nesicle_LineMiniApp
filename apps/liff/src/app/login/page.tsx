"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { api, ApiError } from "@/lib/api";
import { initLiff } from "@/lib/liff";
import { PageSpinner } from "@/components/Spinner";
import { btnLine, btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

const LIFF_ENABLED = Boolean(process.env.NEXT_PUBLIC_LIFF_ID);

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, refresh } = useSession();
  const [checkingLiff, setCheckingLiff] = useState(LIFF_ENABLED);
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!LIFF_ENABLED) return;
    (async () => {
      try {
        console.log("[liff] initializing...");
        const liff = await initLiff();
        if (!liff) {
          console.warn("[liff] initLiff() returned null — NEXT_PUBLIC_LIFF_ID missing at build time?");
          return;
        }
        console.log("[liff] init ok. snapshot:", {
          href: window.location.href,
          isLoggedIn: liff.isLoggedIn(),
          isInClient: liff.isInClient(),
          os: liff.getOS(),
          liffId: liff.id,
          hasAccessToken: Boolean(liff.getAccessToken()),
          hasIdToken: Boolean(liff.getIDToken()),
        });
        if (!liff.isLoggedIn()) {
          // Plain liff.login() with no explicit redirectUri — let the LIFF SDK use its own
          // default (falls back to the registered Endpoint URL / current href internally).
          // An earlier attempt at passing an explicit redirectUri here appeared to make
          // liff.login() silently no-op (no navigation at all) rather than help, so reverted.
          console.log("[liff] not logged in, calling liff.login()");
          liff.login();
          return;
        }
        const [profile, idToken] = await Promise.all([liff.getProfile(), Promise.resolve(liff.getIDToken())]);
        console.log("[liff] profile:", profile, "idToken present:", Boolean(idToken));
        if (!idToken) throw new Error("IDトークンを取得できませんでした。");
        await api.post("/api/auth/liff-login", {
          idToken,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        });
        console.log("[liff] liff-login API call succeeded");
        await refresh();
        router.replace("/");
      } catch (err) {
        console.error("[liff] login flow failed:", err);
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? `LINEログインに失敗しました。(${err.message})`
              : "LINEログインに失敗しました。";
        setError(message);
      } finally {
        setCheckingLiff(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDevLogin(name: string, lineUserId?: string) {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/auth/dev-login", { displayName: name, lineUserId });
      await refresh();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ログインに失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingLiff) {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <p className="text-2xl font-extrabold">ネシクル パートナー</p>
        <p className="mt-2 text-sm text-ink-muted">紹介するだけで報酬がもらえる、紹介者向けLINEミニアプリ</p>
      </div>

      {error && <p className="mb-4 text-center text-xs font-bold text-danger">{error}</p>}

      {LIFF_ENABLED ? (
        <button
          type="button"
          onClick={() => window.location.assign(`${window.location.origin}${window.location.pathname}`)}
          className={clsx(btnLine, "w-full")}
        >
          LINEでログイン
        </button>
      ) : (
        <div className="space-y-4 rounded-lg border border-dashed border-border bg-surface p-5">
          <p className="text-xs font-bold text-warning">開発用ログイン (LIFF未設定)</p>
          <div>
            <label className={labelClass}>表示名</label>
            <input
              className={inputBase}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: 山田 太郎"
            />
          </div>
          <button
            type="button"
            disabled={submitting || !displayName}
            onClick={() => handleDevLogin(displayName)}
            className={clsx(btnPrimary, "w-full")}
          >
            ログイン
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDevLogin("宮本 さくら", "dev-demo-referrer")}
            className="w-full text-xs font-bold text-primary"
          >
            デモ紹介者としてログイン(サンプルデータ入り)→
          </button>
        </div>
      )}
    </div>
  );
}
