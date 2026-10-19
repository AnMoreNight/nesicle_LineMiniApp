import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTAS パートナー",
  description: "紹介するだけで報酬がもらえる、OPTASの紹介者向けLINEミニアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <Providers>
          <div className="app-viewport">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
