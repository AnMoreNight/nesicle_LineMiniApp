import type { CaseStatus, ProgressStatus, RewardStatus, BankAccountType } from "./enums";

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
}

export interface RewardsSummaryDto {
  unconfirmedTotal: number;
  confirmedTotal: number;
  paidTotal: number;
  lifetimeTotal: number;
  hasBankAccount: boolean;
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

export interface ReferralLandingDto {
  referrerDisplayName: string;
  cases: CaseSummaryDto[];
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
