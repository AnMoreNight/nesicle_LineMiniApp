"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BankAccountDto } from "@nesicle/shared";
import { BankAccountType, BANK_ACCOUNT_TYPE_LABEL_JA } from "@nesicle/shared";
import { PageHeader } from "@/components/PageHeader";
import { useApiGet } from "@/lib/useApiGet";
import { api, ApiError } from "@/lib/api";
import { btnPrimary, inputBase, label as labelClass } from "@/lib/ui";
import clsx from "clsx";

const EMPTY: BankAccountDto = {
  bankName: "",
  branchName: "",
  accountType: BankAccountType.ORDINARY,
  accountNumber: "",
  accountHolder: "",
};

export default function BankAccountEditPage() {
  const router = useRouter();
  const { data, loading } = useApiGet<BankAccountDto>("/api/me/bank-account");
  const [form, setForm] = useState<BankAccountDto>(EMPTY);
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
      await api.put("/api/me/bank-account", form);
      router.push("/mypage");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div>
      <PageHeader title="振込先口座" />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
        <p className="rounded-md bg-info-soft px-3 py-2.5 text-base leading-relaxed text-info">
          報酬のお振込先となる口座情報を登録してください。登録内容は運営事務局のみが確認できます。
        </p>
        <div>
          <label className={labelClass}>金融機関名</label>
          <input
            required
            className={inputBase}
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            placeholder="例: みずほ銀行"
          />
        </div>
        <div>
          <label className={labelClass}>支店名</label>
          <input
            required
            className={inputBase}
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            placeholder="例: 渋谷支店"
          />
        </div>
        <div>
          <label className={labelClass}>口座種別</label>
          <select
            className={inputBase}
            value={form.accountType}
            onChange={(e) => setForm({ ...form, accountType: e.target.value as BankAccountDto["accountType"] })}
          >
            {Object.values(BankAccountType).map((type) => (
              <option key={type} value={type}>
                {BANK_ACCOUNT_TYPE_LABEL_JA[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>口座番号</label>
          <input
            required
            className={inputBase}
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            placeholder="1234567"
          />
        </div>
        <div>
          <label className={labelClass}>口座名義(カナ)</label>
          <input
            required
            className={inputBase}
            value={form.accountHolder}
            onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
            placeholder="ヤマダ タロウ"
          />
        </div>
        {error && <p className="text-base font-bold text-danger">{error}</p>}
        <button type="submit" disabled={saving} className={clsx(btnPrimary, "w-full")}>
          {saving ? "保存中…" : "保存する"}
        </button>
      </form>
    </div>
  );
}
