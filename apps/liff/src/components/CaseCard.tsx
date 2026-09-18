import Link from "next/link";
import type { CaseSummaryDto } from "@nesicle/shared";
import { MoneyText } from "./MoneyText";
import { btnOutline, btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

export function CaseCard({
  item,
  inCart,
  onToggleCart,
}: {
  item: CaseSummaryDto;
  inCart: boolean;
  onToggleCart: (item: CaseSummaryDto) => void;
}) {
  return (
    <div className={card}>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">{item.category}</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-bold text-ink-muted">{item.area}</span>
      </div>
      <p className="mt-2 text-base font-bold leading-snug">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] text-ink-muted">紹介報酬</p>
          <MoneyText amount={item.rewardAmount} className="text-lg" />
          {item.rewardLabel && <span className="ml-1 text-xs font-bold text-money">({item.rewardLabel})</span>}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/cases/${item.id}`} className={clsx(btnOutline, "flex-1 !py-2.5")}>
          詳細を見る
        </Link>
        <button type="button" onClick={() => onToggleCart(item)} className={clsx(btnPrimary, "flex-1 !py-2.5")}>
          {inCart ? "カートに追加済み ✓" : "カートに追加"}
        </button>
      </div>
    </div>
  );
}
