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
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedLogin, setAttemptedLogin] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  // SessionProvider already tried, globally, to silently complete any pending LIFF login
  // (see completeLiffLoginIfPossible). If we land here and still have no session, there's
  // nothing pending to complete — kick off a fresh LINE login.
  useEffect(() => {
    if (loading || user || !LIFF_ENABLED || attemptedLogin) return;
    setAttemptedLogin(true);
    (async () => {
      try {
        const liff = await initLiff();
        if (!liff) {
          console.warn("[liff] initLiff() returned null on /login — NEXT_PUBLIC_LIFF_ID missing at build time?");
          return;
        }
        console.log("[liff] no session yet, calling liff.login()");
        liff.login();
      } catch (err) {
        console.error("[liff] failed to start login:", err);
        setError("LINEログインに失敗しました。");
      }
    })();
  }, [loading, user, attemptedLogin]);

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

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <p className="text-2xl font-extrabold">ネシクル パートナー</p>
        <p className="mt-2 text-sm text-ink-muted">紹介するだけで報酬がもらえる、紹介者向けLINEミニアプリ</p>
      </div>

      {error && <p className="mb-4 text-center text-sm font-bold text-danger">{error}</p>}

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
