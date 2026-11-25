"use client";

import clsx from "clsx";
import { ExternalLink } from "./ExternalLink";
import { OPERATOR } from "@/lib/legal";

// 運営会社の名前とお問い合わせ先(LINEミニアプリのポリシーで、アプリ内への表示を求められている)
export function OperatorInfo({ className }: { className?: string }) {
  return (
    <p className={clsx("text-center text-xs leading-relaxed text-ink-muted", className)}>
      運営会社：{OPERATOR.name}
      <span className="mx-1.5">·</span>
      <ExternalLink href={OPERATOR.contactUrl} unstyled icon={false} className="font-bold text-primary underline">
        お問い合わせ
      </ExternalLink>
    </p>
  );
}
