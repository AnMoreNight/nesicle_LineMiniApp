import type { Case, Company } from "@nesicle/db";
import type { CaseDetailDto, CaseSummaryDto, ReferralLandingCaseDto, ReferralLinkCaseDto } from "@nesicle/shared";

type CaseWithCompany = Case & { company: Company };

export function serializeCaseSummary(c: CaseWithCompany): CaseSummaryDto {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    area: c.area,
    summary: c.summary,
    rewardLabel: c.rewardLabel,
    rewardAmount: c.rewardAmount,
    status: c.status,
    companyName: c.company.name,
  };
}

// 申込者(紹介URLを受け取った方)に見せる案件名。案件の title は紹介者向け(「…を紹介して15,000円」
// のように報酬を含む)なので使わず、未入力なら企業名とカテゴリから組み立てる。
export function applicantFacingTitle(c: CaseWithCompany): string {
  return c.landingTitle.trim() || `${c.company.name}の${c.category}サービス`;
}

// 提供会社のWebサイト。管理画面で「表示する」にした案件だけ返す(紹介者の案件詳細・紹介先の画面の両方で同じ設定)。
function visibleProviderUrl(c: CaseWithCompany): string | null {
  const url = c.providerUrl.trim();
  return c.showProviderUrl && url ? url : null;
}

export function serializeLandingCase(c: CaseWithCompany): ReferralLandingCaseDto {
  return {
    id: c.id,
    title: applicantFacingTitle(c),
    category: c.category,
    area: c.area,
    companyName: c.company.name,
    description:
      c.landingDescription.trim() ||
      `${c.company.name}がご提供するサービスです。お申し込み後、担当企業より詳しくご案内いたします。`,
    providerUrl: visibleProviderUrl(c),
  };
}

export function serializeReferralLinkCase(c: CaseWithCompany): ReferralLinkCaseDto {
  return {
    ...serializeCaseSummary(c),
    recipientTitle: applicantFacingTitle(c),
    eligibilityNotes: c.eligibilityNotes,
    ineligibleNotes: c.ineligibleNotes,
    rewardTimingNotes: c.rewardTimingNotes,
  };
}

export function serializeCaseDetail(c: CaseWithCompany): CaseDetailDto {
  return {
    ...serializeCaseSummary(c),
    description: c.description,
    eligibilityNotes: c.eligibilityNotes,
    ineligibleNotes: c.ineligibleNotes,
    rewardTimingNotes: c.rewardTimingNotes,
    providerUrl: visibleProviderUrl(c),
  };
}
