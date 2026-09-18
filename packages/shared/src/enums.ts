export const CaseStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  SUSPENDED: "SUSPENDED",
} as const;
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

/** 紹介 → 申込 → 面談 → 契約 (紹介 itself is implicit: it's the ReferralLink existing before any Application row is created) */
export const ProgressStatus = {
  APPLIED: "APPLIED",
  INTERVIEWING: "INTERVIEWING",
  CONTRACTED: "CONTRACTED",
  INELIGIBLE: "INELIGIBLE",
} as const;
export type ProgressStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus];

export const RewardStatus = {
  UNCONFIRMED: "UNCONFIRMED",
  CONFIRMED: "CONFIRMED",
  PAID: "PAID",
} as const;
export type RewardStatus = (typeof RewardStatus)[keyof typeof RewardStatus];

export const ConsentSubjectType = {
  REFERRER: "REFERRER",
  APPLICANT: "APPLICANT",
} as const;
export type ConsentSubjectType = (typeof ConsentSubjectType)[keyof typeof ConsentSubjectType];

export const ConsentDocumentType = {
  TERMS: "TERMS",
  PRIVACY: "PRIVACY",
} as const;
export type ConsentDocumentType = (typeof ConsentDocumentType)[keyof typeof ConsentDocumentType];

export const BankAccountType = {
  ORDINARY: "ORDINARY",
  CHECKING: "CHECKING",
} as const;
export type BankAccountType = (typeof BankAccountType)[keyof typeof BankAccountType];
