"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CaseSummaryDto, ReferralLinkDto } from "@nesicle/shared";
import { CaseCard } from "@/components/CaseCard";
import { SelectionBar } from "@/components/SelectionBar";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { useCartStore } from "@/lib/cartStore";
import { api, ApiError } from "@/lib/api";

function ReferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreatedId = searchParams.get("justCreated");
  const preselectId = searchParams.get("preselect");

  const { data: cases } = useApiGet<CaseSummaryDto[]>("/api/cases");
  const { data: history, loading: historyLoading, reload } = useApiGet<ReferralLinkDto[]>("/api/me/referral-links");
  // The queue — cases already added via the Cases/Home page's "選択する" button.
  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const hydrate = useCartStore((s) => s.hydrate);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const didPreselect = useRef(false);

  // Which queued items are currently checked, for the "URLを発行"/"削除" buttons to act on.
  // Local to this page only — never synced, and every newly-queued item starts unchecked.
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  function toggleChecked(item: CaseSummaryDto) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }
  function uncheck(caseIds: string[]) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      caseIds.forEach((id) => next.delete(id));
      return next;
    });
  }
  const checkedItems = items.filter((i) => checkedIds.has(i.id));

  // Re-pull the true queue from the server on every visit to this page, not just once at app
  // load — makes the list self-correcting even if local state ever drifts from the DB for any
  // reason, instead of requiring a full app reload to recover. Skipped when arriving via
  // ?preselect= since that flow does its own add() + sync right after — hydrating here too
  // could race it and briefly wipe the just-added case before its POST commits.
  useEffect(() => {
    if (preselectId) return;
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="sticky top-0 z-10">
        <div className="border-b border-border bg-surface px-5 pb-4 pt-4">
          <p className="text-lg font-extrabold tracking-tight">紹介する</p>
          <p className="mt-0.5 text-xs text-ink-muted">案件にチェックを入れて紹介URLを発行します</p>
        </div>

        {checkedItems.length > 0 && (
          <div className="bg-transparent px-5 pb-3 pt-4">
            <SelectionBar checkedItems={checkedItems} onDone={uncheck} onIssued={reload} />
          </div>
        )}
      </div>

      <main className="space-y-6 px-5 py-5">
        <section>
          <p className="mb-3 text-sm font-extrabold text-ink-muted">案件を選択</p>
          {items.length === 0 ? (
            <EmptyState
              icon="📋"
              title="まだ案件が選択されていません"
              description="案件一覧から「選択する」を押すと、ここに追加されます。"
            />
          ) : (
            <div className="space-y-3">
              {items.map((c) => (
                <CaseCard
                  key={c.id}
                  item={c}
                  showCheckbox
                  inCart={checkedIds.has(c.id)}
                  onToggleCart={toggleChecked}
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
