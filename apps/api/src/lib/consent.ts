import { prisma, type Prisma } from "@nesicle/db";

// 現在の利用規約のバージョン。規約を改定したら上げる(未同意扱いになり、再度の同意が必要になる)。
export const TERMS_VERSION = "1.0";

type ConsentDb = Pick<Prisma.TransactionClient, "consentRecord">;

/** 申込者が(登録時に)現在のバージョンの利用規約・プライバシーポリシーに同意済みか */
export async function applicantHasAgreed(applicantId: string, db: ConsentDb = prisma): Promise<boolean> {
  const record = await db.consentRecord.findFirst({
    where: { subjectType: "APPLICANT", subjectId: applicantId, documentType: "TERMS", version: TERMS_VERSION },
    select: { id: true },
  });
  return Boolean(record);
}

/** 申込者の同意を記録する(利用規約・プライバシーポリシー)。同じ版に同意済みのものは追加しない。 */
export async function recordApplicantConsent(applicantId: string, db: ConsentDb = prisma): Promise<void> {
  const agreedBefore = await db.consentRecord.findMany({
    where: { subjectType: "APPLICANT", subjectId: applicantId, version: TERMS_VERSION },
    select: { documentType: true },
  });
  const missing = (["TERMS", "PRIVACY"] as const).filter((d) => !agreedBefore.some((r) => r.documentType === d));
  if (missing.length === 0) return;
  await db.consentRecord.createMany({
    data: missing.map((documentType) => ({
      subjectType: "APPLICANT" as const,
      subjectId: applicantId,
      documentType,
      version: TERMS_VERSION,
    })),
  });
}

/** 紹介者が現在のバージョンの利用規約に同意済みか */
export async function hasAgreedToTerms(userId: string): Promise<boolean> {
  const record = await prisma.consentRecord.findFirst({
    where: { subjectType: "REFERRER", subjectId: userId, documentType: "TERMS", version: TERMS_VERSION },
    select: { id: true },
  });
  return Boolean(record);
}
