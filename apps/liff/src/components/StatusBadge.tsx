import clsx from "clsx";
import {
  PROGRESS_STATUS_LABEL_JA,
  REWARD_STATUS_LABEL_JA,
  type ProgressStatus,
  type RewardStatus,
} from "@nesicle/shared";

const PROGRESS_STYLE: Record<ProgressStatus, string> = {
  APPLIED: "bg-info-soft text-info",
  INTERVIEWING: "bg-warning-soft text-warning",
  CONTRACTED: "bg-success-soft text-success",
  INELIGIBLE: "bg-surface-muted text-ink-muted",
};

const REWARD_STYLE: Record<RewardStatus, string> = {
  UNCONFIRMED: "bg-surface-muted text-ink-muted",
  CONFIRMED: "bg-money-soft text-money",
  PAID: "bg-success-soft text-success",
};

function Badge({ className, children }: { className: string; children: string }) {
  return (
    <span className={clsx("inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-base font-bold", className)}>
      {children}
    </span>
  );
}

export function ProgressBadge({ status }: { status: ProgressStatus }) {
  return <Badge className={PROGRESS_STYLE[status]}>{PROGRESS_STATUS_LABEL_JA[status]}</Badge>;
}

export function RewardBadge({ status }: { status: RewardStatus }) {
  return <Badge className={REWARD_STYLE[status]}>{REWARD_STATUS_LABEL_JA[status]}</Badge>;
}
