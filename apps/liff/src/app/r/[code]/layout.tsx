import type { Metadata } from "next";

// LINEで紹介URLを送ったときのリンクプレビュー(タイトル・説明)に使われる。
// サイト全体の既定は紹介者向け(「OPTAS パートナー」)なので、紹介先向けの文面に差し替える。
const title = "おすすめのサービスのご紹介｜OPTAS";
const description = "ご紹介いただいたサービスの内容をご確認いただけます。気になるサービスがあれば、そのままお申し込みいただけます。";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "OPTAS" },
};

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children;
}
