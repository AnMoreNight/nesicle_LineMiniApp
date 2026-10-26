const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Short, unambiguous (no 0/O/1/I) referral code, e.g. "PT-7K2Q9F". */
export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `PT-${code}`;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/**
 * お問い合わせ番号。申込(Applicant.inquiryNumber)ごとの番号に、その申込内の案件ごとの連番
 * (Application.inquirySeq)を付けた "OP-000123-2" が1件ずつ固有の番号。seq を省くと申込全体の番号。
 */
export function formatInquiryNumber(base: number, seq?: number): string {
  const head = `OP-${String(base).padStart(6, "0")}`;
  return seq ? `${head}-${seq}` : head;
}

/**
 * "OP-000123-2" / "OP-000123" / "op123" / "123-2" / "123" を受け付ける。番号の形でなければ null。
 * seq が null のときは申込全体(同じ申込のすべての案件)を指す。
 */
export function parseInquiryNumber(input: string): { base: number; seq: number | null } | null {
  const m = input.trim().match(/^(?:op-?)?0*(\d{1,9})(?:-(\d{1,3}))?$/i);
  return m ? { base: Number(m[1]), seq: m[2] ? Number(m[2]) : null } : null;
}
