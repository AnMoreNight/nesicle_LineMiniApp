import type { Case, Company } from "@nesicle/db";
import type { CaseDetailDto, CaseSummaryDto, ReferralLandingCaseDto } from "@nesicle/shared";

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

export function serializeLandingCase(c: CaseWithCompany): ReferralLandingCaseDto {
  return {
    id: c.id,
    title: c.title,
    category: c.category,
    area: c.area,
    companyName: c.company.name,
    description: c.description,
    eligibilityNotes: c.eligibilityNotes,
    ineligibleNotes: c.ineligibleNotes,
  };
}

export function serializeCaseDetail(c: CaseWithCompany): CaseDetailDto {
  return {
    ...serializeCaseSummary(c),
    description: c.description,
    eligibilityNotes: c.eligibilityNotes,
    ineligibleNotes: c.ineligibleNotes,
    rewardTimingNotes: c.rewardTimingNotes,
  };
}
