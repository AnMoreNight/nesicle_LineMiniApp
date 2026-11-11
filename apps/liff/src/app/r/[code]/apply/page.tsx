"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ApplyPayload, ApplyResultDto, ReferralLandingDto, ReturningApplicantDto } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { useViewedDocs } from "@/lib/viewedDocs";
import { IconCheckCircle } from "@/components/icons";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

const EMPTY: ApplyPayload = {
  fullName: "",
  postalCode: "",
  address: "",
  phone: "",
  email: "",
  notes: "",
  caseIds: [],
  agreedTerms: false,
};

// 入力途中の内容をタブ単位(sessionStorage)で保存し、このページに戻ったときに復元する。送信が完了したら消す。
// 利用規約・プライバシーポリシーは新しいタブで開くが、同じ画面で開くアプリ内ブラウザ(LINE等)や、
// 紹介ページへ戻った場合・再読み込みでも入力が消えないようにするため。
const draftKey = (code: string) => `apply-draft:${code}`;

const CONTACT_FIELDS = ["fullName", "postalCode", "address", "phone", "email"] as const;

// 同じ方かどうかの比較用(APIの applicantIdentity.ts と同じ規則)。全角半角・大文字小文字・空白・ハイフンは区別しない。
const emailKey = (s: string) => s.normalize("NFKC").trim().toLowerCase();
function phoneKey(s: string) {
  const t = s.normalize("NFKC").trim();
  const digits = t.replace(/\D/g, "");
  return t.startsWith("+81") ? `0${digits.slice(2)}` : digits;
}

function readDraft(code: string): ApplyPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(draftKey(code));
    return saved ? { ...EMPTY, ...JSON.parse(saved) } : null;
  } catch {
    return null;
  }
}

export default function ApplyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);
  const [initialDraft] = useState(() => readDraft(code));
  const [form, setForm] = useState<ApplyPayload>(initialDraft ?? EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 利用規約・プライバシーポリシーの両方を開くまで、同意のチェックはできない
  const legal = useViewedDocs(`apply-viewed:${code}`);
  // この端末で以前に申し込んだ方の連絡先(APIが端末の目印Cookieから返す)。初回の方は null。
  const me = useApiGet<{ applicant: ReturningApplicantDto | null }>("/api/applicant/me");
  const [saved, setSaved] = useState<ReturningApplicantDto | null>(null);

  useEffect(() => {
    const applicant = me.data?.applicant;
    if (!applicant) return;
    setSaved(applicant);
    // 前回の連絡先を入力しておく。このタブで入力途中の下書きがある場合は下書きを優先する。
    if (!initialDraft) {
      setForm((prev) => ({
        ...prev,
        fullName: applicant.fullName,
        postalCode: applicant.postalCode,
        address: applicant.address,
        phone: applicant.phone,
        email: applicant.email,
      }));
    }
  }, [me.data, initialDraft]);

  // 入力欄が前回の連絡先のままか
  const usingSaved = !!saved && CONTACT_FIELDS.every((k) => form[k] === saved[k]);
  // 前回申し込んだ方と同じ方か。APIと同じく、メールアドレスか電話番号のどちらかが一致すれば同じ方
  // (引っ越し・番号変更で片方だけ変えた場合も同じ方)。両方変えた場合は別の方として扱う。
  const samePerson =
    !!saved &&
    ((!!form.email.trim() && emailKey(form.email) === emailKey(saved.email)) ||
      (!!phoneKey(form.phone) && phoneKey(form.phone) === phoneKey(saved.phone)));
  // 同じ方なら、以前に同意した規約と、申し込み済みのサービスはもう一度求めない
  const termsAgreedBefore = samePerson && saved?.agreedTerms === true;
  // 古いAPIは appliedCaseIds を返さないことがある(デプロイの切り替わり中)
  const appliedIds = new Set(samePerson ? (saved?.appliedCaseIds ?? []) : []);
  const agreed = termsAgreedBefore || (form.agreedTerms && legal.bothViewed);
  const selectedIds = form.caseIds.filter((id) => !appliedIds.has(id));
  const allApplied = !!data && data.cases.length > 0 && data.cases.every((c) => appliedIds.has(c.id));

  async function enterSomeoneElse() {
    setSaved(null);
    setForm((prev) => ({ ...prev, fullName: "", postalCode: "", address: "", phone: "", email: "" }));
    try {
      // この端末の目印も消し、次回から入力補完しない
      await api.delete("/api/applicant/me");
    } catch {
      // 消せなくても、メール・電話が違えば別の方として受け付けられる
    }
  }

  useEffect(() => {
    if (!data) return;
    const available = data.cases.map((c) => c.id);
    // 初回は全件選択済み。戻ってきた場合は選び直した内容を残す。
    setForm((prev) => ({
      ...prev,
      caseIds: initialDraft ? prev.caseIds.filter((id) => available.includes(id)) : available,
    }));
  }, [data, initialDraft]);

  useEffect(() => {
    // 申込先の読み込み前(スピナー表示中)は保存しない。この時点の「未選択」を下書きに残すと、
    // すぐ戻ってきたときに申込先が1件も選ばれていない状態で復元されてしまうため。
    if (!data) return;
    try {
      sessionStorage.setItem(draftKey(code), JSON.stringify(form));
    } catch {
      // storage unavailable (e.g. blocked): the form still works, it just won't survive leaving the page
    }
  }, [code, data, form]);

  function toggleCase(id: string) {
    setForm((prev) => ({
      ...prev,
      caseIds: prev.caseIds.includes(id) ? prev.caseIds.filter((c) => c !== id) : [...prev.caseIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError("申込先を1件以上選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<ApplyResultDto>(`/api/r/${code}/apply`, {
        ...form,
        caseIds: selectedIds,
        agreedTerms: agreed,
      });
      const params = new URLSearchParams({ count: String(result.applicationCount) });
      // 案件ごとのお問い合わせ番号と案件名を対で渡す。デプロイの切り替わり中は古いAPIが
      // 返さないことがあるため、無ければ番号なしの完了画面になる。
      for (const a of result.applications ?? []) {
        params.append("no", a.inquiryNumber);
        params.append("t", a.caseTitle);
        params.append("c", a.companyName ?? "");
        // 1 = 以前に申し込み済み(対応中・成約済み)のため、新しい申込にはならなかった案件
        params.append("d", a.alreadyApplied ? "1" : "0");
      }
      if (result.confirmationEmailSent) params.set("mail", "1");
      try {
        sessionStorage.removeItem(draftKey(code));
      } catch {
        // nothing to clear
      }
      legal.clear();
      // replace: 紹介ページ→申込→完了をブラウザの履歴1件のままにする。履歴が1件だけのタブは、
      // 完了画面の×ボタンでページ自身が閉じることをブラウザが許可するため(complete/page.tsx)。
      router.replace(`/r/${code}/complete?${params.toString()}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || me.loading) return <PageSpinner />;

  return (
    <div className="pb-10">
      <PageHeader title="お申し込み" onBack={() => router.replace(`/r/${code}`)} />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        {samePerson && (
          <div className="flex items-start justify-between gap-3 rounded-md bg-primary-soft px-3 py-2.5">
            <p className="text-sm text-ink">
              {usingSaved
                ? "前回のお申し込み内容を入力しています。内容をご確認ください。"
                : "前回お申し込みいただいた方として受け付けます。変更した内容をご確認ください。"}
            </p>
            <button
              type="button"
              onClick={enterSomeoneElse}
              className="shrink-0 text-sm font-bold text-primary-ink underline"
            >
              別の方の情報で入力
            </button>
          </div>
        )}
        <div>
          <label className={labelClass}>お名前</label>
          <input
            required
            className={inputBase}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="例: 山田 花子"
          />
        </div>
        <div>
          <label className={labelClass}>郵便番号</label>
          <input
            className={inputBase}
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            placeholder="150-0001"
          />
        </div>
        <div>
          <label className={labelClass}>住所</label>
          <input
            required
            className={inputBase}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="東京都渋谷区..."
          />
        </div>
        <div>
          <label className={labelClass}>電話番号</label>
          <input
            required
            className={inputBase}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="090-1234-5678"
          />
        </div>
        <div>
          <label className={labelClass}>メールアドレス</label>
          <input
            required
            type="email"
            className={inputBase}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@email.com"
          />
        </div>
        <div>
          <label className={labelClass}>希望内容・補足(任意)</label>
          <textarea
            className={clsx(inputBase, "min-h-24")}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="ご希望の時期や内容など"
          />
        </div>

        <div>
          <p className={labelClass}>申込先を選択(複数選択可)</p>
          {allApplied && (
            <p className="mb-2 rounded-md bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-ink">
              すべてのサービスにお申し込み済みです。別の方がお申し込みになる場合は、上の「別の方の情報で入力」を押してください。
            </p>
          )}
          <div className="space-y-2">
            {(data?.cases ?? []).map((c) => {
              // 申し込み済みのサービスは選べない(もう一度申し込む必要はない)
              const applied = appliedIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={clsx(
                    "flex items-start gap-3 rounded-md border border-border p-3",
                    applied ? "bg-surface-muted" : "bg-surface",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 disabled:opacity-40"
                    checked={!applied && form.caseIds.includes(c.id)}
                    disabled={applied}
                    onChange={() => toggleCase(c.id)}
                  />
                  <span>
                    {applied && (
                      <span className="mb-1 inline-block rounded-sm bg-success-soft px-1.5 py-0.5 text-xs font-bold text-success">
                        お申し込み済み
                      </span>
                    )}
                    <span className={clsx("block text-base font-bold", applied && "text-ink-muted")}>{c.title}</span>
                    <span className="block text-sm text-ink-muted">提供: {c.companyName}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {termsAgreedBefore ? (
          // 前回のお申し込みで同意済み: もう一度チェックしてもらう必要はない(内容はいつでも開ける)
          <p className="flex items-start gap-2 text-sm text-ink-muted">
            <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>
              <a href="/terms" target="_blank" rel="noopener" className="font-bold text-primary underline">
                利用規約
              </a>
              および
              <a href="/privacy" target="_blank" rel="noopener" className="font-bold text-primary underline">
                プライバシーポリシー
              </a>
              には、前回のお申し込み時に同意いただいています。
            </span>
          </p>
        ) : (
          <div>
            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                className="mt-0.5 disabled:opacity-40"
                checked={agreed}
                disabled={!legal.bothViewed}
                onChange={(e) => setForm({ ...form, agreedTerms: e.target.checked })}
              />
              <span>
                {/* 新しいタブで開く。このタブ(入力中のフォーム)はそのまま残り、履歴も増えないため完了画面の×で閉じられる。 */}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener"
                  onClick={() => legal.markViewed("terms")}
                  onAuxClick={() => legal.markViewed("terms")}
                  className="font-bold text-primary underline"
                >
                  利用規約
                </a>
                および
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener"
                  onClick={() => legal.markViewed("privacy")}
                  onAuxClick={() => legal.markViewed("privacy")}
                  className="font-bold text-primary underline"
                >
                  プライバシーポリシー
                </a>
                に同意します
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-sm font-bold text-danger">{error}</p>}

        <button type="submit" disabled={submitting || !agreed || allApplied} className={clsx(btnPrimary, "w-full")}>
          {submitting ? "送信中…" : "この内容で申し込む"}
        </button>
      </form>
    </div>
  );
}
