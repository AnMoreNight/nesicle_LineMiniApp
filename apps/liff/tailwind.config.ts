import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // LINEアプリ自体と同じOS標準の日本語フォント(iOS: ヒラギノ角ゴ / Android: Noto Sans CJK)を使う。
      // Webフォントは読み込まない。Yu Gothic UI / Meiryo はPCでの開発確認用。
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic UI",
          "Meiryo",
          "sans-serif",
        ],
      },
      // 日本語モバイルアプリの標準的なサイズに合わせて Tailwind の既定スケールを置き換える
      // (本文 14px・補足 12px・カード見出し 16px・画面タイトル 18px)。
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.625rem" }],
        "2xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "3xl": ["1.5rem", { lineHeight: "2rem" }],
        "4xl": ["1.75rem", { lineHeight: "2.25rem" }],
      },
      // 800 はヒラギノ W8 / Android では Black 相当まで太くなり重く見えるため、標準的な太字(700)を上限にする。
      fontWeight: {
        extrabold: "700",
      },
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        border: "var(--color-border)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        money: { DEFAULT: "var(--color-money)", soft: "var(--color-money-soft)" },
        line: { DEFAULT: "var(--color-line-brand)" },
        success: { DEFAULT: "var(--color-success)", soft: "var(--color-success-soft)" },
        warning: { DEFAULT: "var(--color-warning)", soft: "var(--color-warning-soft)" },
        danger: { DEFAULT: "var(--color-danger)", soft: "var(--color-danger-soft)" },
        info: { DEFAULT: "var(--color-info)", soft: "var(--color-info-soft)" },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [],
};

export default config;
