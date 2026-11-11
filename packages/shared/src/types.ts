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
  // 提供会社のWebサイト。管理画面で「表示する」にした案件だけ入る。
  providerUrl: string | null;
}

// 紹介URLに含まれる案件。紹介メッセージ(紹介先向けのサービス名)と、取引条件の表示に使う項目を含む。
export interface ReferralLinkCaseDto extends CaseSummaryDto {
  recipientTitle: string;
  eligibilityNotes: string;
  ineligibleNotes: string;
  rewardTimingNotes: string;
}

export interface ReferralLinkDto {
  id: string;
  code: string;
  url: string;
  createdAt: string;
  cases: ReferralLinkCaseDto[];
  // 取引条件に記載する紹介者(受託者)の名称。プロフィールの氏名、未登録ならLINEの表示名。
  referrerName: string;
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

// 紹介された方(申込者)向けの案件情報。title/description は申込者向けの文面(landingTitle /
// landingDescription、未入力なら汎用文面)。紹介者向けの文面・報酬・報酬条件は含めない。
export interface ReferralLandingCaseDto {
  id: string;
  title: string;
  category: string;
  area: string;
  companyName: string;
  description: string;
  // 提供会社のWebサイト。管理画面で「表示する」にした案件だけ入る。
  providerUrl: string | null;
}

export interface ReferralLandingDto {
  referrerDisplayName: string;
  cases: ReferralLandingCaseDto[];
}

export interface ApplyResultDto {
  // 今回新しく受け付けた申込の件数(すでに対応中だった案件は含まない)
  applicationCount: number;
  confirmationEmailSent: boolean;
  // 案件ごとに固有のお問い合わせ番号 (例: "OP-000123-1", "OP-000123-2")。
  // alreadyApplied: 同じ方が同じ案件にすでに申し込み済み(対応中)のため、新しい申込は作らず既存の番号を返したもの。
  applications: Array<{ inquiryNumber: string; caseTitle: string; companyName: string; alreadyApplied?: boolean }>;
}

// この端末で以前に申し込んだ方の連絡先。申込フォームにあらかじめ入力するために使う。
export interface ReturningApplicantDto {
  fullName: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
}

export interface ApplyPayload {
  fullName: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  caseIds: string[];
  agreedTerms: boolean;
}
