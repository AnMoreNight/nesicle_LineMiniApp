import type { Case, Company } from "@nesicle/db";
import type { CaseDetailDto, CaseSummaryDto } from "@nesicle/shared";

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

export function serializeCaseDetail(c: CaseWithCompany): CaseDetailDto {
  return {
    ...serializeCaseSummary(c),
    description: c.description,
    eligibilityNotes: c.eligibilityNotes,
    ineligibleNotes: c.ineligibleNotes,
    rewardTimingNotes: c.rewardTimingNotes,
  };
}
