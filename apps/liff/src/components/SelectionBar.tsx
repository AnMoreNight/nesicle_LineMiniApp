"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferralLinkDto } from "@nesicle/shared";
import { useCartStore } from "@/lib/cartStore";
import { api, ApiError } from "@/lib/api";

export function SelectionBar({ onIssued }: { onIssued?: () => void }) {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function handleIssue() {
    setSubmitting(true);
    setError(null);
    try {
      const link = await api.post<ReferralLinkDto>("/api/referral-links", {
        caseIds: items.map((c) => c.id),
      });
      clear();
      onIssued?.();
      router.push(`/refer?justCreated=${link.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "紹介URLの発行に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full bg-primary-soft py-1.5 pl-4 pr-1.5">
        <span className="text-xs font-bold text-primary">{items.length}件選択中</span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={handleIssue}
            disabled={submitting}
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? "発行中…" : "URLを発行"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-danger/40 bg-surface px-3 py-1.5 text-xs font-bold text-danger"
          >
            削除
          </button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}
