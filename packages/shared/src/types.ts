import type { CaseStatus, ProgressStatus, RewardStatus, BankAccountType, PayoutRequestStatus, PayoutMethod } from "./enums";

export interface CaseSummaryDto {
  id: string;
  title: string;
  category: string;
  area: string;
  summary: string;
  rewardLabel: string;
  rewardAmount: number;
  status: CaseStatus;
  companyName: string;
}

export interface CaseDetailDto extends CaseSummaryDto {
  description: string;
  eligibilityNotes: string;
  ineligibleNotes: string;
  rewardTimingNotes: string;
}

export interface ReferralLinkDto {
  id: string;
  code: string;
  url: string;
  createdAt: string;
  cases: CaseSummaryDto[];
}

export interface ReferrerApplicationDto {
  id: string;
  applicantName: string;
  caseTitle: string;
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
  rewardAmount: number | null;
  referredAt: string;
  updatedAt: string;
  ineligibleReason: string | null;
  // 紹介者自身による「完了報告」日時。null なら未報告。
  referrerReportedAt: string | null;
}

export interface RewardsSummaryDto {
  unconfirmedTotal: number;
  confirmedTotal: number;
  paidTotal: number;
  lifetimeTotal: number;
  hasBankAccount: boolean;
  // 完了報告 + 運営側の成果確認が完了し報酬が確定していて、まだ振込申請されていない報酬額
  payoutEligibleTotal: number;
}

export interface PayoutRequestApplicationSummary {
  caseTitle: string;
  rewardAmount: number | null;
}

export interface PayoutRequestDto {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutRequestStatus;
  requestedAt: string;
  paidAt: string | null;
  applications: PayoutRequestApplicationSummary[];
}

export interface ReferrerProfileDto {
  displayName: string;
  fullName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
}

export interface BankAccountDto {
  bankName: string;
  branchName: string;
  accountType: BankAccountType;
  accountNumber: string;
  accountHolder: string;
}

// 紹介された方(申込者)向けの案件情報。紹介者向けに書かれた「概要」と紹介者の報酬額は含めない。
export interface ReferralLandingCaseDto {
  id: string;
  title: string;
  category: string;
  area: string;
  companyName: string;
  description: string;
  eligibilityNotes: string;
  ineligibleNotes: string;
}

export interface ReferralLandingDto {
  referrerDisplayName: string;
  cases: ReferralLandingCaseDto[];
}

export interface ApplyResultDto {
  applicationCount: number;
  confirmationEmailSent: boolean;
  // 案件ごとに固有のお問い合わせ番号 (例: "OP-000123-1", "OP-000123-2")
  applications: Array<{ inquiryNumber: string; caseTitle: string }>;
}

export interface ApplyPayload {
  fullName: string;
  birthDate: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  caseIds: string[];
  agreedTerms: boolean;
}
