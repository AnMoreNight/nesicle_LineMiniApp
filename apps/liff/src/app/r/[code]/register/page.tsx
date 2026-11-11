"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RegisterApplicantPayload, ReturningApplicantDto } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner } from "@/components/Spinner";
import { IconCheckCircle } from "@/components/icons";
import { useApiGet } from "@/lib/useApiGet";
import { useViewedDocs } from "@/lib/viewedDocs";
import { markJustRegistered } from "@/lib/referralFlow";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

// 申込者の登録(はじめての方のみ)と、登録内容の変更。サービスの選択と申込は紹介ページで行う。
// 登録するとこの端末に目印が付き、以降は紹介ページから直接申し込める。

type Contact = Omit<RegisterApplicantPayload, "agreedTerms">;
const EMPTY: Contact = { fullName: "", postalCode: "", address: "", phone: "", email: "" };
const CONTACT_FIELDS = ["fullName", "postalCode", "address", "phone", "email"] as const;

// 入力途中の内容をタブ単位で保存する。利用規約・プライバシーポリシーを同じ画面で開くアプリ内ブラウザ(LINE等)や、
// 紹介ページへ戻った場合・再読み込みでも入力が消えないように。登録が済んだら消す。
const DRAFT_KEY = "applicant-register-draft";

function readDraft(): Contact | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    return saved ? { ...EMPTY, ...JSON.parse(saved) } : null;
  } catch {
    return null;
  }
}

// 同じ方かどうかの比較用(APIの applicantIdentity.ts と同じ規則)。全角半角・大文字小文字・空白・ハイフンは区別しない。
const emailKey = (s: string) => s.normalize("NFKC").trim().toLowerCase();
function phoneKey(s: string) {
  const t = s.normalize("NFKC").trim();
  const digits = t.replace(/\D/g, "");
  return t.startsWith("+81") ? `0${digits.slice(2)}` : digits;
}

export default function RegisterPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  // この端末で登録済みの方の連絡先(登録内容の変更のときに入力しておく)。はじめての方は null。
  const me = useApiGet<{ applicant: ReturningApplicantDto | null }>("/api/applicant/me");
  const [initialDraft] = useState(readDraft);
  const [form, setForm] = useState<Contact>(initialDraft ?? EMPTY);
  const [saved, setSaved] = useState<ReturningApplicantDto | null>(null);
  const [checked, setChecked] = useState(false);
  // 利用規約・プライバシーポリシーの両方を開くまで、同意のチェックはできない
  const legal = useViewedDocs("register-viewed");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const applicant = me.data?.applicant;
    if (!applicant) return;
    setSaved(applicant);
    // 登録済みの連絡先を入力しておく。このタブで入力途中の下書きがある場合は下書きを優先する。
    if (!initialDraft) {
      setForm({
        fullName: applicant.fullName,
        postalCode: applicant.postalCode,
        address: applicant.address,
        phone: applicant.phone,
        email: applicant.email,
      });
    }
  }, [me.data, initialDraft]);

  useEffect(() => {
    // 登録済みの連絡先の読み込み前は保存しない(空の下書きが残ると、次に開いたとき入力しておけなくなる)
    if (me.loading) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // storage unavailable (e.g. blocked): the form still works, it just won't survive leaving the page
    }
  }, [me.loading, form]);

  // 入力欄が登録済みの連絡先のままか
  const usingSaved = !!saved && CONTACT_FIELDS.every((k) => form[k] === saved[k]);
  // 登録済みの方と同じ方か。APIと同じく、メールアドレスか電話番号のどちらかが一致すれば同じ方
  // (引っ越し・番号変更で片方だけ変えた場合も同じ方)。両方変えた場合は別の方として扱う。
  const samePerson =
    !!saved &&
    ((!!form.email.trim() && emailKey(form.email) === emailKey(saved.email)) ||
      (!!phoneKey(form.phone) && phoneKey(form.phone) === phoneKey(saved.phone)));
  // 同じ方で、以前に同意済みなら、もう一度チェックしてもらう必要はない
  const termsAgreedBefore = samePerson && saved?.agreedTerms === true;
  const agreed = termsAgreedBefore || (checked && legal.bothViewed);
  // 登録済みの方が登録内容を変更している
  const editing = termsAgreedBefore;

  async function enterSomeoneElse() {
    setSaved(null);
    setForm(EMPTY);
    try {
      // この端末の目印も消し、別の方として登録する
      await api.delete("/api/applicant/me");
    } catch {
      // 消せなくても、メール・電話が違えば別の方として登録される
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/applicant", { ...form, agreedTerms: agreed });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // nothing to clear
      }
      legal.clear();
      // 紹介ページに戻り、選んだサービスのまま申込の確認を開く
      markJustRegistered(code, editing ? "edit" : "new");
      router.replace(`/r/${code}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "送信に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  if (me.loading) return <PageSpinner />;

  return (
    <div className="pb-10">
      <PageHeader title={editing ? "ご登録内容の変更" : "ご登録"} onBack={() => router.replace(`/r/${code}`)} />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        {!saved && (
          <p className="text-sm leading-relaxed text-ink-muted">
            お申し込みに必要なご連絡先を登録してください。ご登録は初回のみで、次回からはこの画面なしでお申し込みいただけます。
          </p>
        )}
        {samePerson && (
          <div className="flex items-start justify-between gap-3 rounded-md bg-primary-soft px-3 py-2.5">
            <p className="text-sm text-ink">
              {usingSaved ? "ご登録の内容を表示しています。" : "ご登録の内容を変更しています。"}
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

        {termsAgreedBefore ? (
          // 以前に同意済み: もう一度チェックしてもらう必要はない(内容はいつでも開ける)
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
              には、同意いただいています。
            </span>
          </p>
        ) : (
          <label className="flex items-start gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-0.5 disabled:opacity-40"
              checked={agreed}
              disabled={!legal.bothViewed}
              onChange={(e) => setChecked(e.target.checked)}
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
        )}

        {error && <p className="text-sm font-bold text-danger">{error}</p>}

        <button type="submit" disabled={submitting || !agreed} className={clsx(btnPrimary, "w-full")}>
          {submitting ? "送信中…" : editing ? "変更を保存してお申し込みへ戻る" : "登録してお申し込みへ進む"}
        </button>
      </form>
    </div>
  );
}
