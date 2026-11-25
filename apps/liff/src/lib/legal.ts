// 利用規約・プライバシーポリシーは、運営会社のWebサイトに掲載している正式版を表示する
// (LINEミニアプリの申請に登録するURLと同じ)。アプリ内の /terms・/privacy もここへ転送する(next.config.mjs)。
export const LEGAL_URLS = {
  terms: "https://optas.co.jp/terms.html",
  privacy: "https://optas.co.jp/privacy.html",
} as const;

// サービス事業主(運営会社)。LINEミニアプリのポリシーにより、名前と連絡先をアプリ内に表示する(OperatorInfo)。
export const OPERATOR = {
  name: "株式会社OPTAS",
  contactUrl: "https://optas.co.jp/contact.html",
} as const;
