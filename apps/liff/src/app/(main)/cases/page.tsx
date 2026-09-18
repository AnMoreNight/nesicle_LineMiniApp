"use client";

import { useMemo, useState } from "react";
import type { CaseSummaryDto } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { CaseCard } from "@/components/CaseCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { useCartStore } from "@/lib/cartStore";
import clsx from "clsx";

export default function CasesPage() {
  const { data: cases, loading } = useApiGet<CaseSummaryDto[]>("/api/cases");
  const cart = useCartStore();
  const [category, setCategory] = useState<string>("すべて");

  const categories = useMemo(() => ["すべて", ...new Set((cases ?? []).map((c) => c.category))], [cases]);
  const filtered = (cases ?? []).filter((c) => category === "すべて" || c.category === category);

  return (
    <div>
      <TopBar title="案件一覧" subtitle={`公開中 ${cases?.length ?? 0}件`} />
      <main className="space-y-4 px-5 py-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold",
                category === cat ? "border-primary bg-primary text-white" : "border-border bg-surface text-ink-muted",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔍" title="該当する案件がありません" />
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <CaseCard key={c.id} item={c} inCart={cart.has(c.id)} onToggleCart={cart.toggle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
