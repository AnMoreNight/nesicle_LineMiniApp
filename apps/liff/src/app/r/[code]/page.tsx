"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  ApplyResultDto,
  ReferralLandingCaseDto,
  ReferralLandingDto,
  ReturningApplicantDto,
} from "@nesicle/shared";
import { PageSpinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ExternalLink } from "@/components/ExternalLink";
import { IconCheckCircle } from "@/components/icons";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import {
  clearSelection,
  consumeJustRegistered,
  readSelection,
  saveSelection,
  type RegisteredKind,
} from "@/lib/referralFlow";
import { btnPrimary, card, inputBase } from "@/lib/ui";
import clsx from "clsx";

// これより長い説明文は最初の数行だけ表示し、「続きを読む」で全文を開く。
const COLLAPSE_CHARS = 140;
const COLLAPSE_LINES = 4;

const STEPS = [
  "下のボタンからお申し込み(はじめての方のみ、お名前とご連絡先のご登録が必要です)",
  "担当企業から、ご登録の連絡先へご連絡",
  "内容にご納得いただけたら、サービスをご利用",
];

function LandingCase({
  c,
  applied,
  selectable,
  checked,
  onToggle,
}: {
  c: ReferralLandingCaseDto;
  applied: boolean;
  selectable: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Vercel(フロント)と Render(API)は同時にはデプロイされないため、古いAPIはこの項目を返さないことがある。
  const description = c.description ?? "";
  const isLong = description.length > COLLAPSE_CHARS || description.split("\n").length > COLLAPSE_LINES;

  return (
    <div className={clsx(card, "relative", selectable && "pr-12")}>
      {/* サービスが複数のときは、申し込むサービスをここで選ぶ(アプリの案件一覧と同じ位置のチェック) */}
      {selectable && (
        <label className="absolute right-4 top-4 flex cursor-pointer items-center" aria-label="このサービスに申し込む">
          <input type="checkbox" checked={checked} onChange={onToggle} className="h-6 w-6 accent-primary" />
        </label>
      )}
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

// 登録済みの方の申込の確認。選んだサービスと登録済みの連絡先を見せ、ここで申し込む。
function ConfirmSheet({
  code,
  cases,
  applicant,
  welcome,
  onEdit,
  onClose,
}: {
  code: string;
  cases: ReferralLandingCaseDto[];
  applicant: ReturningApplicantDto;
  welcome: RegisteredKind | null;
  onEdit: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<ApplyResultDto>(`/api/r/${code}/apply`, { caseIds: cases.map((c) => c.id), notes });
      const params = new URLSearchParams({ count: String(result.applicationCount) });
      // 案件ごとのお問い合わせ番号・案件名・企業名と、以前に申し込み済みだったか(1/0)を対で渡す
      for (const a of result.applications ?? []) {
        params.append("no", a.inquiryNumber);
        params.append("t", a.caseTitle);
        params.append("c", a.companyName ?? "");
        params.append("d", a.alreadyApplied ? "1" : "0");
      }
      if (result.confirmationEmailSent) params.set("mail", "1");
      clearSelection(code);
      // replace: 紹介ページ→完了をブラウザの履歴1件のままにする(完了画面の×でページ自身を閉じられるように)
      router.replace(`/r/${code}/complete?${params.toString()}`);
    } catch (err) {
      // 登録が見つからない(別の端末で目印が消えた等)ときは登録画面へ
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/r/${code}/register`);
        return;
      }
      setError(err instanceof ApiError ? err.message : "送信に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={submitting ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="お申し込みの確認"
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto overscroll-contain rounded-t-lg bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <p className="text-lg font-bold">お申し込みの確認</p>
          <button type="button" onClick={onClose} disabled={submitting} className="text-sm font-bold text-primary">
            閉じる
          </button>
        </div>
        <div className="safe-bottom space-y-4 px-5 pb-6 pt-4">
          {welcome && (
            <p className="flex items-start gap-2 rounded-md bg-success-soft px-3 py-2.5 text-sm text-ink">
              <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {welcome === "edit"
                ? "ご登録内容を保存しました。内容をご確認のうえ、お申し込みください。"
                : "ご登録ありがとうございます。内容をご確認のうえ、お申し込みください。"}
            </p>
          )}

          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-muted">お申し込みするサービス</p>
            <ul className="divide-y divide-border rounded-md border border-border">
              {cases.map((c) => (
                <li key={c.id} className="px-3 py-2.5">
                  <p className="text-base font-bold">{c.title}</p>
                  <p className="text-xs text-ink-muted">提供: {c.companyName}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-bold text-ink-muted">ご連絡先</p>
              <button type="button" onClick={onEdit} disabled={submitting} className="text-xs font-bold text-primary underline">
                登録内容の変更
              </button>
            </div>
            <div className="rounded-md bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-ink">
              <p className="font-bold">{applicant.fullName} 様</p>
              <p>{applicant.phone}</p>
              <p className="break-all">{applicant.email}</p>
            </div>
          </div>

          <div>
            <label htmlFor="apply-notes" className="mb-1.5 block text-xs font-bold text-ink-muted">
              希望内容・補足(任意)
            </label>
            <textarea
              id="apply-notes"
              className={clsx(inputBase, "min-h-20")}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ご希望の時期や内容など"
            />
          </div>

          {error && <p className="text-sm font-bold text-danger">{error}</p>}

          <button type="button" onClick={submit} disabled={submitting} className={clsx(btnPrimary, "w-full")}>
            {submitting ? "送信中…" : "この内容で申し込む"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading, error } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);
  // この端末で登録済みの方か(登録済みなら登録画面なしでここから申し込める)と、申し込み済みのサービス
  const me = useApiGet<{ applicant: ReturningApplicantDto | null }>("/api/applicant/me");
  const applicant = me.data?.applicant ?? null;
  const registered = applicant?.agreedTerms === true;
  // 古いAPIは appliedCaseIds を返さないことがある(デプロイの切り替わり中)
  const appliedIds = applicant?.appliedCaseIds ?? [];

  // 申し込むサービス(複数のときだけチェックで選ぶ)。登録画面へ行って戻っても選んだまま。
  const [selected, setSelected] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [welcome, setWelcome] = useState<RegisteredKind | null>(null);

  useEffect(() => {
    if (!data || me.loading || selected !== null) return;
    const open = data.cases.map((c) => c.id).filter((id) => !appliedIds.includes(id));
    const saved = readSelection(code);
    setSelected(saved ? saved.filter((id) => open.includes(id)) : open);
    // 登録を済ませて戻ってきたところなら、そのまま申込の確認を開く
    const justRegistered = consumeJustRegistered(code);
    if (justRegistered && registered && (saved ?? open).some((id) => open.includes(id))) {
      setWelcome(justRegistered);
      setConfirming(true);
    }
  }, [data, me.loading, selected, appliedIds, code, registered]);

  useEffect(() => {
    if (selected) saveSelection(code, selected);
  }, [code, selected]);

  if (loading || me.loading) return <PageSpinner />;

  if (error || !data) {
    return (
      <div className="px-6 py-16">
        <EmptyState icon="🔗" title="紹介URLが見つかりません" description={error ?? "URLをご確認ください。"} />
      </div>
    );
  }

  const count = data.cases.length;
  const multi = count > 1;
  const openCases = data.cases.filter((c) => !appliedIds.includes(c.id));
  const allApplied = openCases.length === 0;
  const chosen = multi ? openCases.filter((c) => selected?.includes(c.id)) : openCases;

  // replace: 紹介ページ→登録→紹介ページ→完了をブラウザの履歴1件のままにする(完了画面の×で閉じられるように)
  const goRegister = () => router.replace(`/r/${code}/register`);
  async function someoneElse() {
    // この端末の目印を消して、別の方として登録から始める
    try {
      await api.delete("/api/applicant/me");
    } catch {
      // 消せなくても、登録画面で「別の方の情報で入力」を選べる
    }
    goRegister();
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const cur = prev ?? [];
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    });
  }

  return (
    <div className="min-h-viewport px-5 pb-40 pt-8">
      <p className="text-center text-xl font-extrabold">OPTAS</p>

      <section className="mt-5 rounded-lg bg-primary-soft px-4 py-5 text-center">
        <p className="text-sm font-bold text-primary-ink">{data.referrerDisplayName} さんからのご紹介</p>
        <p className="mt-1.5 text-xl font-bold leading-snug text-ink">
          {multi ? `おすすめのサービスが${count}件届いています` : "おすすめのサービスが届いています"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          内容をご確認のうえ、気になるサービスにお申し込みください。
        </p>
      </section>

      <div className="mb-3 mt-6 flex items-baseline justify-between gap-2">
        <p className="text-base font-extrabold text-ink-muted">サービスの内容</p>
        {multi && !allApplied && <p className="text-xs text-ink-muted">申し込むサービスにチェック</p>}
      </div>
      <div className="space-y-3">
        {data.cases.map((c) => {
          const applied = appliedIds.includes(c.id);
          return (
            <LandingCase
              key={c.id}
              c={c}
              applied={applied}
              selectable={multi && !applied}
              checked={!!selected?.includes(c.id)}
              onToggle={() => toggle(c.id)}
            />
          );
        })}
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
        {allApplied ? (
          // すべて申し込み済み: もう一度申し込む必要はない。同じ端末を使う別の方のためにだけ入口を残す。
          <div className="mb-3 text-center">
            <p className="rounded-md bg-surface-muted py-3 text-base font-bold text-ink-muted">
              {multi ? "すべてのサービスにお申し込み済みです" : "このサービスはお申し込み済みです"}
            </p>
            <button type="button" onClick={someoneElse} className="mt-2 text-sm font-bold text-primary underline">
              別の方がお申し込みになる場合はこちら
            </button>
          </div>
        ) : registered && applicant ? (
          // 登録済みの方: 登録画面なしで、ここから申し込む
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={chosen.length === 0}
              className={clsx(btnPrimary, "w-full")}
            >
              {!multi
                ? "このサービスに申し込む"
                : chosen.length > 0
                  ? `選んだサービスに申し込む(${chosen.length}件)`
                  : "申し込むサービスを選んでください"}
            </button>
            <p className="mt-2 text-center text-xs text-ink-muted">
              {applicant.fullName} 様としてお申し込みします
              <span className="mx-1.5">·</span>
              <button type="button" onClick={goRegister} className="font-bold text-primary underline">
                登録内容の変更
              </button>
              <span className="mx-1.5">·</span>
              <button type="button" onClick={someoneElse} className="font-bold text-primary underline">
                別の方
              </button>
            </p>
          </div>
        ) : (
          // はじめての方: まず登録(連絡先と利用規約・プライバシーポリシーへの同意)。登録後はこの画面に戻って申し込む。
          <div className="mb-3">
            <button type="button" onClick={goRegister} className={clsx(btnPrimary, "w-full")}>
              登録して申し込む
            </button>
            <p className="mt-2 text-center text-xs text-ink-muted">
              はじめての方は、お名前・ご連絡先のご登録をお願いします(初回のみ)
            </p>
          </div>
        )}
      </div>

      {confirming && applicant && chosen.length > 0 && (
        <ConfirmSheet
          code={code}
          cases={chosen}
          applicant={applicant}
          welcome={welcome}
          onEdit={goRegister}
          onClose={() => {
            setConfirming(false);
            setWelcome(null);
          }}
        />
      )}
    </div>
  );
}
