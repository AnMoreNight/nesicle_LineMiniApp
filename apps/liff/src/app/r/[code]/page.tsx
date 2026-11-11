"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReferralLandingCaseDto, ReferralLandingDto, ReturningApplicantDto } from "@nesicle/shared";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ExternalLink } from "@/components/ExternalLink";
import { IconCheckCircle } from "@/components/icons";
import { useApiGet } from "@/lib/useApiGet";
import { btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

// これより長い説明文は最初の数行だけ表示し、「続きを読む」で全文を開く。
const COLLAPSE_CHARS = 140;
const COLLAPSE_LINES = 4;

const STEPS = [
  "下のボタンから、お名前とご連絡先を入力",
  "担当企業から、ご登録の連絡先へご連絡",
  "内容にご納得いただけたら、サービスをご利用",
];

function LandingCase({ c, applied }: { c: ReferralLandingCaseDto; applied: boolean }) {
  const [expanded, setExpanded] = useState(false);
  // Vercel(フロント)と Render(API)は同時にはデプロイされないため、古いAPIはこの項目を返さないことがある。
  const description = c.description ?? "";
  const isLong = description.length > COLLAPSE_CHARS || description.split("\n").length > COLLAPSE_LINES;

  return (
    <div className={card}>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-primary-soft px-2 py-0.5 text-sm font-bold text-primary-ink">{c.category}</span>
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-sm font-bold text-ink-muted">{c.area}</span>
        {applied && (
          <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-sm font-bold text-success">
            <IconCheckCircle className="h-4 w-4" />
            お申し込み済み
          </span>
        )}
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

      {/* 管理画面で「表示する」にした案件だけ。新しいタブで開き、この画面(申込の流れ)はそのまま残す。 */}
      {c.providerUrl && (
        <div className="mt-3 border-t border-border pt-2.5">
          <p className="text-xs text-ink-muted">{c.companyName}のWebサイト</p>
          <ExternalLink href={c.providerUrl} className="mt-0.5 text-sm">
            {c.providerUrl}
          </ExternalLink>
        </div>
      )}
    </div>
  );
}

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading, error } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);
  // この端末で以前に申し込んだ方なら、申し込み済みのサービスにはもう一度申し込まなくてよいことを示す
  const me = useApiGet<{ applicant: ReturningApplicantDto | null }>("/api/applicant/me");

  if (loading || me.loading) return <PageSpinner />;

  if (error || !data) {
    return (
      <div className="px-6 py-16">
        <EmptyState icon="🔗" title="紹介URLが見つかりません" description={error ?? "URLをご確認ください。"} />
      </div>
    );
  }

  const count = data.cases.length;
  // 古いAPIは appliedCaseIds を返さないことがある(デプロイの切り替わり中)
  const applied = new Set(me.data?.applicant?.appliedCaseIds ?? []);
  const allApplied = data.cases.every((c) => applied.has(c.id));
  const goApply = () => router.replace(`/r/${code}/apply`);

  return (
    <div className="min-h-viewport px-5 pb-28 pt-8">
      <p className="text-center text-xl font-extrabold">OPTAS</p>

      <section className="mt-5 rounded-lg bg-primary-soft px-4 py-5 text-center">
        <p className="text-sm font-bold text-primary-ink">{data.referrerDisplayName} さんからのご紹介</p>
        <p className="mt-1.5 text-xl font-bold leading-snug text-ink">
          {count > 1 ? `おすすめのサービスが${count}件届いています` : "おすすめのサービスが届いています"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          内容をご確認のうえ、気になるサービスにお申し込みください。
        </p>
      </section>

      <p className="mb-3 mt-6 text-base font-extrabold text-ink-muted">サービスの内容</p>
      <div className="space-y-3">
        {data.cases.map((c) => (
          <LandingCase key={c.id} c={c} applied={applied.has(c.id)} />
        ))}
      </div>

      <section className="mt-6">
        <p className="mb-3 text-base font-extrabold text-ink-muted">お申し込みの流れ</p>
        <ol className="space-y-2.5">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-6 rounded-md bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-ink-muted">
        ご入力いただく個人情報は、紹介者(OPTAS パートナー)には共有されません。内容をご確認のうえ、ご自身でお申し込みください。
      </p>

      {/* 申込ボタンは常に画面下に表示し、長い説明を最後までスクロールしなくても申し込めるようにする。 */}
      <div className="safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface px-5 pt-3">
        {/* replace: 紹介ページ→申込→完了をブラウザの履歴1件のままにする(完了画面の×で閉じられるように) */}
        {allApplied ? (
          // すべて申し込み済み: もう一度申し込む必要はない。同じ端末を使う別の方のためにだけ入口を残す。
          <div className="mb-3 text-center">
            <p className="rounded-md bg-surface-muted py-3 text-base font-bold text-ink-muted">
              {count > 1 ? "すべてのサービスにお申し込み済みです" : "このサービスはお申し込み済みです"}
            </p>
            <button type="button" onClick={goApply} className="mt-2 text-sm font-bold text-primary underline">
              別の方がお申し込みになる場合はこちら
            </button>
          </div>
        ) : (
          <button type="button" onClick={goApply} className={clsx(btnPrimary, "mb-3 w-full")}>
            {count > 1 ? "サービスを選んで申し込む" : "このサービスに申し込む"}
          </button>
        )}
      </div>
    </div>
  );
}
