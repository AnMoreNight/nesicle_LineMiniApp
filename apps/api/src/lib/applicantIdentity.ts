// 申込者が「以前に申し込んだことのある人」かどうかの判定と、今回の申込のうち
// 新しく作るもの・すでに対応中のものの振り分け。
// 同じ人 = メールアドレスと電話番号が両方一致(大文字小文字・全角半角・空白・ハイフンは区別しない)。

/** 比較用のメールアドレス(全角→半角、前後の空白を除き、小文字にそろえる) */
export function normalizeEmail(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase();
}

/** 比較用の電話番号(数字だけにする)。+81 で始まる国際表記は 0 始まりの国内表記にそろえる。 */
export function normalizePhone(phone: string): string {
  const s = phone.normalize("NFKC").trim();
  const digits = s.replace(/\D/g, "");
  return s.startsWith("+81") ? `0${digits.slice(2)}` : digits;
}

/** 対応中(まだ成約・対象外になっていない)の申込。同じ案件に再度申し込まれても新しい申込は作らない。 */
const IN_PROGRESS: readonly string[] = ["APPLIED", "INTERVIEWING"];

export interface ExistingApplication {
  caseId: string;
  inquirySeq: number;
  progressStatus: string;
}

/**
 * 選ばれた案件ごとに、同じ案件の対応中の申込があればそれを使い(alreadyApplied: true、番号も既存のまま)、
 * なければ新しい申込として次の連番を振る。連番はこの申込者の既存の最大値の続きから。
 */
export function planApplications<C extends { id: string }>(cases: C[], existing: ExistingApplication[]) {
  const inProgress = new Map<string, number>();
  for (const a of existing) {
    if (IN_PROGRESS.includes(a.progressStatus)) inProgress.set(a.caseId, a.inquirySeq);
  }
  let nextSeq = existing.reduce((max, a) => Math.max(max, a.inquirySeq), 0) + 1;
  return cases.map((c) => {
    const seq = inProgress.get(c.id);
    return seq !== undefined
      ? { case: c, seq, alreadyApplied: true }
      : { case: c, seq: nextSeq++, alreadyApplied: false };
  });
}
