"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseSummaryDto, ReferralLinkDto } from "@nesicle/shared";
import { useCartStore } from "@/lib/cartStore";
import { api, ApiError } from "@/lib/api";

export function SelectionBar({
  checkedItems,
  onDone,
  onIssued,
}: {
  /** The currently-checked subset of the /refer page's queue list — issue/delete act only on these. */
  checkedItems: CaseSummaryDto[];
  /** Called with the acted-on case ids after a successful issue or delete, so the page can
   *  un-check them (they're no longer in the queue, so there's nothing left to have checked). */
  onDone: (caseIds: string[]) => void;
  onIssued?: () => void;
}) {
  const removeMany = useCartStore((s) => s.removeMany);
  const removeLocal = useCartStore((s) => s.removeLocal);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // setSubmitting(true) doesn't disable the button in the DOM until React commits the render,
  // which lags a fast double-click by a frame or two — this ref blocks re-entry synchronously,
  // the instant the second click fires, so "issue"/"delete" can never fire twice in a row.
  const busyRef = useRef(false);

  if (checkedItems.length === 0) return null;

  async function handleIssue() {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setError(null);
    const ids = checkedItems.map((c) => c.id);
    try {
      const link = await api.post<ReferralLinkDto>("/api/referral-links", { caseIds: ids });
      // The backend already deleted the matching queue rows when the link was created;
      // this just resets local state to match, no extra API call needed.
      removeLocal(ids);
      onDone(ids);
      onIssued?.();
      router.push(`/refer?justCreated=${link.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "紹介URLの発行に失敗しました。");
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleClear() {
    if (busyRef.current) return;
    busyRef.current = true;
    setSubmitting(true);
    setError(null);
    const ids = checkedItems.map((c) => c.id);
    try {
      await removeMany(ids);
      onDone(ids);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "選択の削除に失敗しました。もう一度お試しください。");
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full bg-primary py-1.5 pl-4 pr-1.5">
        <span className="text-xs font-bold text-white">{checkedItems.length}件選択中</span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={handleIssue}
            disabled={submitting}
            className="w-20 rounded-full bg-white py-1.5 text-center text-xs font-bold text-primary disabled:opacity-60"
          >
            {submitting ? "発行中…" : "URLを発行"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={submitting}
            className="w-20 rounded-full bg-white py-1.5 text-center text-xs font-bold text-danger disabled:opacity-60"
          >
            削除
          </button>
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-danger">{error}</p>}
    </div>
  );
}
