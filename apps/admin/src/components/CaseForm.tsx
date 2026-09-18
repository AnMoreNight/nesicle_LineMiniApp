"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { CaseInput, CompanyBase } from "@/types/admin";

// `category` is a free-text column in the schema (no enum) — these are just suggestions
// (from packages/db/prisma/seed.ts) offered via a <datalist>, not an enforced whitelist.
const CATEGORY_SUGGESTIONS = ["転職", "車買取", "保険", "引越し", "不動産"];

interface CaseFormProps {
  companies: CompanyBase[];
  initial?: Partial<CaseInput>;
  submitLabel: string;
  onSubmit: (input: CaseInput) => Promise<void>;
}

export function CaseForm({ companies, initial, submitLabel, onSubmit }: CaseFormProps) {
  const [values, setValues] = useState<CaseInput>({
    companyId: initial?.companyId ?? companies[0]?.id ?? "",
    title: initial?.title ?? "",
    category: initial?.category ?? "",
    area: initial?.area ?? "",
    summary: initial?.summary ?? "",
    description: initial?.description ?? "",
    eligibilityNotes: initial?.eligibilityNotes ?? "",
    ineligibleNotes: initial?.ineligibleNotes ?? "",
    rewardTimingNotes: initial?.rewardTimingNotes ?? "",
    rewardLabel: initial?.rewardLabel ?? "",
    rewardAmount: initial?.rewardAmount ?? 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="掲載企業">
          <Select required value={values.companyId} onChange={(e) => set("companyId", e.target.value)}>
            <option value="" disabled>
              選択してください
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="カテゴリ" hint="自由入力（例: 転職 / 車買取 / 保険 / 引越し / 不動産）">
          <Input
            required
            maxLength={30}
            list="case-category-suggestions"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <datalist id="case-category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="案件タイトル">
        <Input required maxLength={100} value={values.title} onChange={(e) => set("title", e.target.value)} />
      </Field>

      <Field label="エリア">
        <Input required maxLength={60} value={values.area} onChange={(e) => set("area", e.target.value)} />
      </Field>

      <Field label="概要（一覧表示用の短文）">
        <Textarea
          required
          maxLength={200}
          rows={2}
          value={values.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </Field>

      <Field label="詳細説明">
        <Textarea
          required
          maxLength={4000}
          rows={6}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="報酬表示ラベル" hint="例: 最大30,000円">
          <Input
            required
            maxLength={60}
            value={values.rewardLabel}
            onChange={(e) => set("rewardLabel", e.target.value)}
          />
        </Field>
        <Field label="報酬額（円）">
          <Input
            type="number"
            required
            min={0}
            value={values.rewardAmount}
            onChange={(e) => set("rewardAmount", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="対象条件" hint="任意">
        <Textarea rows={3} maxLength={1000} value={values.eligibilityNotes} onChange={(e) => set("eligibilityNotes", e.target.value)} />
      </Field>

      <Field label="対象外条件" hint="任意">
        <Textarea rows={3} maxLength={1000} value={values.ineligibleNotes} onChange={(e) => set("ineligibleNotes", e.target.value)} />
      </Field>

      <Field label="報酬支払時期に関する注記" hint="任意">
        <Textarea
          rows={3}
          maxLength={1000}
          value={values.rewardTimingNotes}
          onChange={(e) => set("rewardTimingNotes", e.target.value)}
        />
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
