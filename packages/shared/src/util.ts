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

/** 申込者向けのお問い合わせ番号 (例: "OP-000123")。Applicant.inquiryNumber の表示形式。 */
export function formatInquiryNumber(n: number): string {
  return `OP-${String(n).padStart(6, "0")}`;
}

/** "OP-000123" / "op123" / "123" のいずれも受け付け、数値部分を返す。番号の形でなければ null。 */
export function parseInquiryNumber(input: string): number | null {
  const m = input.trim().match(/^(?:op-?)?0*(\d{1,9})$/i);
  return m ? Number(m[1]) : null;
}
