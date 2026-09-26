"use client";

import { useState } from "react";
import type { ReferralLinkDto } from "@nesicle/shared";
import { buildShareMessage, copyText, shareViaLine, shareViaSms } from "@/lib/share";
import { btnLine, btnSecondary, card } from "@/lib/ui";
import { IconCopy, IconTrash } from "./icons";
import clsx from "clsx";

const iconBtn = "flex h-12 w-12 shrink-0 items-center justify-center rounded-md border transition active:scale-[.98]";

export function ShareLinkCard({
  link,
  highlight = false,
  onDelete,
}: {
  link: ReferralLinkDto;
  highlight?: boolean;
  onDelete?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = buildShareMessage(
    link.url,
    link.cases.map((c) => c.title),
  );

  return (
    <div className={clsx(card, highlight && "border-primary/40 ring-2 ring-primary/15")}>
      <div className="flex flex-wrap gap-1.5">
        {link.cases.map((c) => (
          <span key={c.id} className="rounded-md bg-primary-soft px-2.5 py-1 text-base font-bold text-primary">
            {c.title}
          </span>
        ))}
      </div>
      <p className="mt-2 break-all rounded-md border border-border bg-surface-muted px-3 py-2.5 text-base text-ink-muted">
        {link.url}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => shareViaLine(link.url, message)}
          className={clsx(btnLine, "flex-1 !px-2 text-base")}
        >
          LINEで送る
        </button>
        <button
          type="button"
          onClick={() => shareViaSms(message)}
          className={clsx(btnSecondary, "flex-1 !px-2 text-base")}
        >
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
          aria-label={copied ? "コピー済み" : "URLをコピー"}
          title={copied ? "コピー済み" : "URLをコピー"}
          className={clsx(iconBtn, copied ? "border-success bg-success-soft text-success" : "border-border text-ink-muted")}
        >
          <IconCopy className="h-5 w-5" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="紹介URLを削除"
            title="削除する"
            className={clsx(iconBtn, "border-danger/30 text-danger")}
          >
            <IconTrash className="h-5 w-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-muted">発行日: {new Date(link.createdAt).toLocaleDateString("ja-JP")}</p>
    </div>
  );
}
