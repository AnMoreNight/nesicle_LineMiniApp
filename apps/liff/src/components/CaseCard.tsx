import Link from "next/link";
import type { CaseSummaryDto } from "@nesicle/shared";
import { MoneyText } from "./MoneyText";
import { card, btnSecondary } from "@/lib/ui";
import clsx from "clsx";

export function CaseCard({
  item,
  showCheckbox = false,
  showAddButton = false,
  inCart = false,
  onToggleCart,
}: {
  item: CaseSummaryDto;
  showCheckbox?: boolean;
  showAddButton?: boolean;
  inCart?: boolean;
  onToggleCart?: (item: CaseSummaryDto) => void;
}) {
  return (
    <div className={clsx(card, "relative", showCheckbox && "pr-12")}>
      {showCheckbox && (
        <label className="absolute right-4 top-4 flex cursor-pointer items-center" aria-label="この案件を紹介対象として選択">
          <input
            type="checkbox"
            checked={inCart}
            onChange={() => onToggleCart?.(item)}
            className="h-6 w-6 accent-primary"
          />
        </label>
      )}
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">{item.category}</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-bold text-ink-muted">{item.area}</span>
      </div>
      <p className="mt-2 text-base font-bold leading-snug">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
      <div className="mt-3">
        <p className="text-[11px] text-ink-muted">紹介報酬</p>
        <MoneyText amount={item.rewardAmount} className="text-lg" />
        {item.rewardLabel && <span className="ml-1 text-xs font-bold text-money">({item.rewardLabel})</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={`/cases/${item.id}`} className={clsx(btnSecondary, "flex-1 !py-2.5")}>
          詳細
        </Link>
        {showAddButton ? (
          <button
            type="button"
            onClick={() => onToggleCart?.(item)}
            className={clsx(
              "flex-1 rounded-md !py-2.5 text-sm font-bold transition",
              inCart ? "bg-primary text-white" : "border border-primary text-primary",
            )}
          >
            {inCart ? "選択中 ✓" : "選択する"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
