import {
  CASE_STATUS_LABEL_JA,
  PROGRESS_STATUS_LABEL_JA,
  REWARD_STATUS_LABEL_JA,
  type CaseStatus,
  type ProgressStatus,
  type RewardStatus,
} from "@nesicle/shared";

type Tone = "info" | "warning" | "success" | "danger" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-muted text-ink-muted",
};

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

const CASE_STATUS_TONE: Record<CaseStatus, Tone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  SUSPENDED: "danger",
};

const PROGRESS_STATUS_TONE: Record<ProgressStatus, Tone> = {
  APPLIED: "info",
  INTERVIEWING: "warning",
  CONTRACTED: "success",
  INELIGIBLE: "danger",
};

const REWARD_STATUS_TONE: Record<RewardStatus, Tone> = {
  UNCONFIRMED: "neutral",
  CONFIRMED: "warning",
  PAID: "success",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <Badge label={CASE_STATUS_LABEL_JA[status]} tone={CASE_STATUS_TONE[status]} />;
}

export function ProgressStatusBadge({ status }: { status: ProgressStatus }) {
  return <Badge label={PROGRESS_STATUS_LABEL_JA[status]} tone={PROGRESS_STATUS_TONE[status]} />;
}

export function RewardStatusBadge({ status }: { status: RewardStatus }) {
  return <Badge label={REWARD_STATUS_LABEL_JA[status]} tone={REWARD_STATUS_TONE[status]} />;
}

export function BoolBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
  return <Badge label={value ? trueLabel : falseLabel} tone={value ? "success" : "neutral"} />;
}
