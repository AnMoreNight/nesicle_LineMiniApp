import { CaseStatus, ProgressStatus, RewardStatus, BankAccountType } from "./enums";

export const CASE_STATUS_LABEL_JA: Record<CaseStatus, string> = {
  DRAFT: "下書き",
  PUBLISHED: "公開中",
  SUSPENDED: "停止中",
};

export const PROGRESS_STATUS_LABEL_JA: Record<ProgressStatus, string> = {
  APPLIED: "申込",
  INTERVIEWING: "面談中",
  CONTRACTED: "契約成立",
  INELIGIBLE: "対象外",
};

export const REWARD_STATUS_LABEL_JA: Record<RewardStatus, string> = {
  UNCONFIRMED: "未確定",
  CONFIRMED: "確定(未払い)",
  PAID: "支払済み",
};

export const BANK_ACCOUNT_TYPE_LABEL_JA: Record<BankAccountType, string> = {
  ORDINARY: "普通",
  CHECKING: "当座",
};
