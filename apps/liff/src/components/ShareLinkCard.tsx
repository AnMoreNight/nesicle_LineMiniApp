"use client";

import { useState } from "react";
import type { ReferralLinkDto } from "@nesicle/shared";
import { buildShareMessage, copyText, shareViaLine, shareViaSms } from "@/lib/share";
import { btnLine, btnOutline, btnSecondary, card } from "@/lib/ui";
import { IconCopy } from "./icons";
import clsx from "clsx";

export function ShareLinkCard({ link, highlight = false }: { link: ReferralLinkDto; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const message = buildShareMessage(
    link.url,
    link.cases.map((c) => c.title),
  );

  return (
    <div className={clsx(card, highlight && "border-primary/40 ring-2 ring-primary/15")}>
      <div className="flex flex-wrap gap-1.5">
        {link.cases.map((c) => (
          <span key={c.id} className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
            {c.title}
          </span>
        ))}
      </div>
      <p className="mt-2 break-all rounded-md border border-border bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
        {link.url}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={() => shareViaLine(link.url, message)} className={clsx(btnLine, "!px-2 text-xs")}>
          LINEで送る
        </button>
        <button type="button" onClick={() => shareViaSms(message)} className={clsx(btnSecondary, "!px-2 text-xs")}>
          SMSで送る
        </button>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(link.url);
            if (ok) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className={clsx(btnOutline, "!px-2 text-xs")}
        >
          <IconCopy className="h-4 w-4" />
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">発行日: {new Date(link.createdAt).toLocaleDateString("ja-JP")}</p>
    </div>
  );
}
