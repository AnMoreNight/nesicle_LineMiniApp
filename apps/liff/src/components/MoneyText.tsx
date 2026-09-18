import clsx from "clsx";
import { formatYen } from "@nesicle/shared";

export function MoneyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={clsx("font-extrabold text-money tabular-nums", className)}>{formatYen(amount)}</span>;
}
