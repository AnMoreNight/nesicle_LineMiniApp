"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { api, ApiError } from "@/lib/api";
import { PageSpinner } from "@/components/Spinner";
import { IconChevronRight } from "@/components/icons";
import { btnPrimary, card } from "@/lib/ui";
import { useViewedDocs, type LegalDoc } from "@/lib/viewedDocs";
import clsx from "clsx";

const TERMS_VERSION = "1.0";

// 利用規約・プライバシーポリシーへの同意画面。同意するまでは、紹介URLの発行・コピーを含む
// アプリの機能は使えない((main)/layout.tsx がここへ案内し、APIも未同意の発行を断る)。
export default function AgreePage() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  // 利用規約・プライバシーポリシーの両方を開くまで、同意のチェックはできない
  const legal = useViewedDocs("agree-viewed");
  const agreed = checked && legal.bothViewed;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.hasAgreedTerms !== false) router.replace("/");
  }, [loading, user, router]);

  async function agree() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/me/consent", { documentType: "TERMS", version: TERMS_VERSION });
      await api.post("/api/me/consent", { documentType: "PRIVACY", version: TERMS_VERSION });
      await refresh();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "送信に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  if (loading || !user || user.hasAgreedTerms !== false) return <PageSpinner />;

  return (
    <div className="flex min-h-viewport flex-col justify-center px-6 py-10">
      <p className="text-center text-2xl font-extrabold">ご利用の前に</p>
      <p className="mt-3 text-center text-sm leading-relaxed text-ink-muted">
        OPTAS パートナーをご利用いただくには、利用規約およびプライバシーポリシーへの同意が必要です。
        内容をご確認のうえ、同意してください。
      </p>

      <div className={clsx(card, "mt-6 divide-y divide-border !p-0")}>
        {(
          [
            ["terms", "/terms", "利用規約"],
            ["privacy", "/privacy", "プライバシーポリシー"],
          ] as [LegalDoc, string, string][]
        ).map(([doc, href, title]) => (
          <Link
            key={doc}
            href={href}
            onClick={() => legal.markViewed(doc)}
            className="flex items-center justify-between px-4 py-3.5 text-base font-bold"
          >
            {title}
            <span className="flex items-center gap-1.5">
              {legal.viewed[doc] && <span className="text-xs font-bold text-success">確認済み</span>}
              <IconChevronRight className="h-4 w-4 text-ink-muted" />
            </span>
          </Link>
        ))}
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          className="mt-0.5 disabled:opacity-40"
          checked={agreed}
          disabled={!legal.bothViewed}
          onChange={(e) => setChecked(e.target.checked)}
        />
        利用規約およびプライバシーポリシーに同意します
      </label>

      {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}

      <button type="button" disabled={!agreed || submitting} onClick={agree} className={clsx(btnPrimary, "mt-5 w-full")}>
        {submitting ? "送信中…" : "同意して利用を開始する"}
      </button>
    </div>
  );
}
