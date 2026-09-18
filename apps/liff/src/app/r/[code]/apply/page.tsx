"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ApplyPayload, ReferralLandingDto } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

const EMPTY: ApplyPayload = {
  fullName: "",
  birthDate: "",
  postalCode: "",
  address: "",
  phone: "",
  email: "",
  notes: "",
  caseIds: [],
  agreedTerms: false,
};

export default function ApplyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);
  const [form, setForm] = useState<ApplyPayload>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm((prev) => ({ ...prev, caseIds: data.cases.map((c) => c.id) }));
    }
  }, [data]);

  function toggleCase(id: string) {
    setForm((prev) => ({
      ...prev,
      caseIds: prev.caseIds.includes(id) ? prev.caseIds.filter((c) => c !== id) : [...prev.caseIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.caseIds.length === 0) {
      setError("申込先を1件以上選択してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<{ trackingId: string; applicationCount: number }>(`/api/r/${code}/apply`, form);
      router.push(`/r/${code}/complete?count=${result.applicationCount}&id=${result.trackingId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="pb-10">
      <PageHeader title="お申し込み" />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
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
          <label className={labelClass}>生年月日</label>
          <input
            required
            type="date"
            className={inputBase}
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
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
          <div className="space-y-2">
            {(data?.cases ?? []).map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-3 rounded-md border border-border bg-surface p-3"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.caseIds.includes(c.id)}
                  onChange={() => toggleCase(c.id)}
                />
                <span>
                  <span className="block text-sm font-bold">{c.title}</span>
                  <span className="block text-xs text-ink-muted">{c.summary}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.agreedTerms}
            onChange={(e) => setForm({ ...form, agreedTerms: e.target.checked })}
          />
          利用規約およびプライバシーポリシーに同意します
        </label>

        {error && <p className="text-xs font-bold text-danger">{error}</p>}

        <button type="submit" disabled={submitting || !form.agreedTerms} className={clsx(btnPrimary, "w-full")}>
          {submitting ? "送信中…" : "この内容で申し込む"}
        </button>
      </form>
    </div>
  );
}
