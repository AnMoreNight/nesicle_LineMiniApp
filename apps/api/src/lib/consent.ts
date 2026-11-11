import { prisma } from "@nesicle/db";

// 現在の利用規約のバージョン。規約を改定したら上げる(未同意扱いになり、再度の同意が必要になる)。
export const TERMS_VERSION = "1.0";

/** 申込者が以前のお申し込みで、現在のバージョンの利用規約・プライバシーポリシーに同意済みか */
export async function applicantHasAgreed(applicantId: string): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: { subjectType: "APPLICANT", subjectId: applicantId, documentType: "TERMS", version: TERMS_VERSION },
    select: { id: true },
  });
  return Boolean(record);
}

/** 紹介者が現在のバージョンの利用規約に同意済みか */
export async function hasAgreedToTerms(userId: string): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: { subjectType: "REFERRER", subjectId: userId, documentType: "TERMS", version: TERMS_VERSION },
    select: { id: true },
  });
  return Boolean(record);
}
