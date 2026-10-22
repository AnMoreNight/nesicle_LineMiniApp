"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReferralLandingCaseDto, ReferralLandingDto } from "@nesicle/shared";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { useApiGet } from "@/lib/useApiGet";
import { btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

// これより長い説明文は最初の数行だけ表示し、「続きを読む」で全文を開く。
const COLLAPSE_CHARS = 140;
const COLLAPSE_LINES = 4;

function LandingCase({ c }: { c: ReferralLandingCaseDto }) {
  const [expanded, setExpanded] = useState(false);
  // Vercel(フロント)と Render(API)は同時にはデプロイされないため、古いAPIはこの項目を返さないことがある。
  const description = c.description ?? "";
  const isLong = description.length > COLLAPSE_CHARS || description.split("\n").length > COLLAPSE_LINES;

  return (
    <div className={card}>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-sm font-bold text-primary">{c.category}</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-sm font-bold text-ink-muted">{c.area}</span>
      </div>
      <p className="mt-2 text-lg font-bold leading-snug">{c.title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">提供: {c.companyName}</p>

      {description && (
        <div className="mt-2.5">
          <p className={clsx("whitespace-pre-line text-base leading-relaxed text-ink", isLong && !expanded && "line-clamp-4")}>
            {description}
          </p>
          {isLong && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-bold text-primary">
              {expanded ? "閉じる" : "続きを読む"}
            </button>
          )}
        </div>
      )}

      {(c.eligibilityNotes || c.ineligibleNotes) && (
        <dl className="mt-3 space-y-2 rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          {c.eligibilityNotes && (
            <div>
              <dt className="font-bold text-ink">対象となる方</dt>
              <dd className="mt-0.5 whitespace-pre-line leading-relaxed text-ink-muted">{c.eligibilityNotes}</dd>
            </div>
          )}
          {c.ineligibleNotes && (
            <div>
              <dt className="font-bold text-ink">対象外となる場合</dt>
              <dd className="mt-0.5 whitespace-pre-line leading-relaxed text-ink-muted">{c.ineligibleNotes}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading, error } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);

  if (loading) return <PageSpinner />;

  if (error || !data) {
    return (
      <div className="px-6 py-16">
        <EmptyState icon="🔗" title="紹介URLが見つかりません" description={error ?? "URLをご確認ください。"} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="mb-6 text-center">
        <p className="text-xl font-extrabold">OPTAS</p>
      </div>

      <div className="rounded-lg bg-primary-soft px-4 py-3 text-base font-bold text-primary">
        {data.referrerDisplayName} さんから紹介が届いています
      </div>

      <p className="mb-3 mt-6 text-base font-extrabold text-ink-muted">紹介されたサービス</p>
      <div className="space-y-3">
        {data.cases.map((c) => (
          <LandingCase key={c.id} c={c} />
        ))}
      </div>

      <p className="mt-6 rounded-md bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-ink-muted">
        ご入力いただく個人情報は、紹介者(OPTAS パートナー)には共有されません。内容をご確認のうえ、ご自身でお申し込みください。
      </p>

      <button type="button" onClick={() => router.push(`/r/${code}/apply`)} className={clsx(btnPrimary, "mt-6 w-full")}>
        内容を確認して申し込む
      </button>
    </div>
  );
}
