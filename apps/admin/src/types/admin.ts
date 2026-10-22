import type {
  BankAccountType,
  CaseStatus,
  ProgressStatus,
  RewardStatus,
  PayoutRequestStatus,
  PayoutMethod,
} from "@nesicle/shared";

/**
 * These types mirror exactly what apps/api/src/routes/admin/*.ts return (Prisma objects with
 * the includes shown in each handler, JSON-serialized so Date -> ISO string). There is no
 * OpenAPI spec; the route files are the contract.
 */

export interface CompanyBase {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyListItem extends CompanyBase {
  caseCount: number;
}

export interface CaseBase {
  id: string;
  companyId: string;
  title: string;
  category: string;
  area: string;
  summary: string;
  description: string;
  eligibilityNotes: string;
  ineligibleNotes: string;
  rewardTimingNotes: string;
  rewardLabel: string;
  rewardAmount: number;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CaseWithCompany extends CaseBase {
  company: CompanyBase;
}

export interface CompanyDetail extends CompanyBase {
  cases: CaseBase[];
}

export interface CaseInput {
  companyId: string;
  title: string;
  category: string;
  area: string;
  summary: string;
  description: string;
  eligibilityNotes: string;
  ineligibleNotes: string;
  rewardTimingNotes: string;
  rewardLabel: string;
  rewardAmount: number;
}

export interface CompanyInput {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

export interface UserBase {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferrerProfileBase {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountBase {
  id: string;
  referrerProfileId: string;
  bankName: string;
  branchName: string;
  accountType: BankAccountType;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralLinkBase {
  id: string;
  code: string;
  referrerId: string;
  createdAt: string;
}

export interface ApplicantBase {
  id: string;
  inquiryNumber: number;
  fullName: string;
  birthDate: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface ApplicationBase {
  id: string;
  applicantId: string;
  caseId: string;
  referralLinkId: string;
  progressStatus: ProgressStatus;
  rewardStatus: RewardStatus;
  rewardAmount: number | null;
  ineligibleReason: string | null;
  internalNotes: string;
  // パートナー(紹介者)によるワンタッチ「完了報告」の日時。null なら未報告。
  referrerReportedAt: string | null;
  payoutRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/admin/referrers list item (flattened aggregate shape from loadReferrers()) */
export interface ReferrerListItem {
  id: string;
  displayName: string;
  fullName: string;
  phone: string;
  email: string;
  hasBankAccount: boolean;
  linkCount: number;
  applicationCount: number;
  confirmedTotal: number;
  paidTotal: number;
  createdAt: string;
}

/** GET /api/admin/referrers/:id */
export interface ReferrerDetail extends UserBase {
  referrerProfile: (ReferrerProfileBase & { bankAccount: BankAccountBase | null }) | null;
  referralLinks: Array<
    ReferralLinkBase & {
      cases: Array<{ id: string; referralLinkId: string; caseId: string; case: CaseBase }>;
      applications: Array<ApplicationBase & { applicant: ApplicantBase; case: CaseBase }>;
    }
  >;
}

/** GET /api/admin/applicants and GET /api/admin/applicants/:id (same include shape) */
export interface ApplicantDetail extends ApplicantBase {
  applications: Array<
    ApplicationBase & {
      case: CaseBase;
      referralLink: ReferralLinkBase & { referrer: UserBase };
    }
  >;
}

/** GET /api/admin/applications, GET .../:id, PATCH .../:id (same includeForList shape) */
export interface ApplicationListItem extends ApplicationBase {
  applicant: ApplicantBase;
  case: CaseWithCompany;
  referralLink: ReferralLinkBase & { referrer: UserBase };
}

export interface AdminStats {
  referrerCount: number;
  publishedCaseCount: number;
  applicationsThisMonth: number;
  pendingPayoutTotal: number;
  paidThisMonthTotal: number;
}

export interface ApplicationUpdateInput {
  progressStatus?: ProgressStatus;
  rewardStatus?: RewardStatus;
  rewardAmount?: number | null;
  ineligibleReason?: string | null;
  internalNotes?: string;
}

/** GET /api/admin/payout-requests */
export interface PayoutRequestListItem {
  id: string;
  amount: number;
  method: PayoutMethod;
  status: PayoutRequestStatus;
  requestedAt: string;
  paidAt: string | null;
  user: UserBase & {
    referrerProfile: (ReferrerProfileBase & { bankAccount: BankAccountBase | null }) | null;
  };
  applications: Array<ApplicationBase & { case: CaseBase }>;
}
