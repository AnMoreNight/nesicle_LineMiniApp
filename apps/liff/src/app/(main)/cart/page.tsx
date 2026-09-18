"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReferralLinkDto } from "@nesicle/shared";
import { formatYen } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { PageSpinner } from "@/components/Spinner";
import { IconCheckCircle } from "@/components/icons";
import { useApiGet } from "@/lib/useApiGet";
import { useCartStore } from "@/lib/cartStore";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

export default function CartPage() {
  const cart = useCartStore();
  const { data: history, loading: historyLoading, reload } = useApiGet<ReferralLinkDto[]>("/api/me/referral-links");
  const [justGenerated, setJustGenerated] = useState<ReferralLinkDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalReward = cart.items.reduce((sum, c) => sum + c.rewardAmount, 0);

  async function handleGenerate() {
    setSubmitting(true);
    setError(null);
    try {
      const link = await api.post<ReferralLinkDto>("/api/referral-links", {
        caseIds: cart.items.map((c) => c.id),
      });
      setJustGenerated(link);
      cart.clear();
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "紹介URLの発行に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <TopBar title="紹介する" subtitle="案件を選んで、1つの紹介URLを発行します" />
      <main className="space-y-6 px-5 py-5">
        {justGenerated && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-success">
              <IconCheckCircle className="h-6 w-6" />
              <p className="font-extrabold">紹介URLを発行しました</p>
            </div>
            <ShareLinkCard link={justGenerated} highlight />
            <button type="button" onClick={() => setJustGenerated(null)} className="text-xs font-bold text-primary">
              続けて他の案件も紹介する →
            </button>
          </section>
        )}

        {!justGenerated && (
          <section>
            <p className="mb-3 text-base font-extrabold">紹介カート ({cart.items.length}件)</p>
            {cart.items.length === 0 ? (
              <EmptyState
                icon="🛒"
                title="カートが空です"
                description="案件一覧から気になる案件をカートに追加すると、まとめて1つの紹介URLを作れます。"
                action={
                  <Link href="/cases" className={btnPrimary}>
                    案件を探す
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className={clsx(card, "flex items-center justify-between gap-3")}>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-money">{item.rewardLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(item.id)}
                      className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-bold text-ink-muted"
                    >
                      削除
                    </button>
                  </div>
                ))}
                <div className={clsx(card, "flex items-center justify-between")}>
                  <span className="text-xs font-bold text-ink-muted">最大報酬合計</span>
                  <span className="text-lg font-extrabold text-money">{formatYen(totalReward)}</span>
                </div>
                {error && <p className="text-xs font-bold text-danger">{error}</p>}
                <button type="button" onClick={handleGenerate} disabled={submitting} className={clsx(btnPrimary, "w-full")}>
                  {submitting ? "発行中…" : `この${cart.items.length}件で紹介URLを発行する`}
                </button>
              </div>
            )}
          </section>
        )}

        <section>
          <p className="mb-3 text-base font-extrabold">発行済みの紹介URL</p>
          {historyLoading ? (
            <PageSpinner />
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-ink-muted">まだ紹介URLを発行していません。</p>
          ) : (
            <div className="space-y-3">
              {history.map((link) => (
                <ShareLinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
