"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CaseSummaryDto, ReferralLinkDto } from "@nesicle/shared";
import { CaseCard } from "@/components/CaseCard";
import { SelectionBar } from "@/components/SelectionBar";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { useCartStore } from "@/lib/cartStore";
import { api, ApiError } from "@/lib/api";
import clsx from "clsx";

function ReferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreatedId = searchParams.get("justCreated");
  const preselectId = searchParams.get("preselect");

  const { data: cases, loading: casesLoading } = useApiGet<CaseSummaryDto[]>("/api/cases");
  const { data: history, loading: historyLoading, reload } = useApiGet<ReferralLinkDto[]>("/api/me/referral-links");
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const toggle = useCartStore((s) => s.toggle);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const didPreselect = useRef(false);

  useEffect(() => {
    if (didPreselect.current || !preselectId || !cases) return;
    didPreselect.current = true;
    const match = cases.find((c) => c.id === preselectId);
    if (match) add(match);
    // Strip ?preselect= from the URL once consumed. Otherwise a later reload of this same
    // URL (e.g. a hard refresh) would silently re-add the case again, undoing any delete.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preselect");
    router.replace(params.size > 0 ? `/refer?${params.toString()}` : "/refer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectId, cases]);

  async function handleDelete(id: string) {
    if (!window.confirm("この紹介URLを削除しますか?この操作は取り消せません。")) return;
    setDeleteError(null);
    try {
      await api.delete(`/api/me/referral-links/${id}`);
      reload();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "削除に失敗しました。");
    }
  }

  return (
    <div>
      <div className={clsx("sticky top-0 z-10 bg-surface px-5 pt-4", items.length === 0 && "pb-4")}>
        <p className="text-lg font-extrabold tracking-tight">紹介する</p>
        <p className="mt-0.5 text-xs text-ink-muted">案件にチェックを入れて紹介URLを発行します</p>
        {items.length > 0 && (
          <div className="-mx-5 mt-3 bg-bg px-5 py-3">
            <SelectionBar onIssued={reload} />
          </div>
        )}
      </div>

      <main className="space-y-6 px-5 py-5">
        <section>
          <p className="mb-3 text-sm font-extrabold text-ink-muted">案件を選択</p>
          {casesLoading ? (
            <PageSpinner />
          ) : (
            <div className="space-y-3">
              {(cases ?? []).map((c) => (
                <CaseCard
                  key={c.id}
                  item={c}
                  showCheckbox
                  inCart={items.some((i) => i.id === c.id)}
                  onToggleCart={toggle}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="mb-3 text-sm font-extrabold text-ink-muted">発行済みの紹介URL</p>
          {deleteError && <p className="mb-3 text-xs font-bold text-danger">{deleteError}</p>}
          {historyLoading ? (
            <PageSpinner />
          ) : !history || history.length === 0 ? (
            <p className="text-sm text-ink-muted">まだ紹介URLを発行していません。</p>
          ) : (
            <div className="space-y-3">
              {history.map((link) => (
                <ShareLinkCard
                  key={link.id}
                  link={link}
                  highlight={link.id === justCreatedId}
                  onDelete={() => handleDelete(link.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ReferContent />
    </Suspense>
  );
}
