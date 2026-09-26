"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferrerProfileDto } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { PageSpinner } from "@/components/Spinner";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

type FormState = Omit<ReferrerProfileDto, "displayName">;

const EMPTY: FormState = { fullName: "", phone: "", email: "", postalCode: "", address: "" };

export default function ProfileEditPage() {
  const router = useRouter();
  const { data, loading } = useApiGet<ReferrerProfileDto>("/api/me/profile");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put("/api/me/profile", form);
      router.push("/mypage");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="プロフィール編集" />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <div>
          <label className={labelClass}>氏名</label>
          <input
            required
            className={inputBase}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="例: 山田 太郎"
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
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
        <button type="submit" disabled={saving} className={clsx(btnPrimary, "w-full")}>
          {saving ? "保存中…" : "保存する"}
        </button>
      </form>
    </div>
  );
}
