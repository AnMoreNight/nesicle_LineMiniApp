"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import type { CompanyInput } from "@/types/admin";

interface CompanyFormProps {
  initial?: Partial<CompanyInput>;
  submitLabel: string;
  onSubmit: (input: CompanyInput) => Promise<void>;
}

export function CompanyForm({ initial, submitLabel, onSubmit }: CompanyFormProps) {
  const [values, setValues] = useState<CompanyInput>({
    name: initial?.name ?? "",
    contactName: initial?.contactName ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? "",
    notes: initial?.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
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
      <Field label="企業名">
        <Input required maxLength={100} value={values.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="担当者名" hint="任意">
          <Input maxLength={60} value={values.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </Field>
        <Field label="担当者メール" hint="任意">
          <Input
            type="email"
            maxLength={120}
            value={values.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
          />
        </Field>
      </div>
      <Field label="担当者電話番号" hint="任意">
        <Input maxLength={30} value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
      </Field>
      <Field label="備考" hint="任意">
        <Textarea rows={4} maxLength={1000} value={values.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "保存中..." : submitLabel}
      </Button>
    </form>
  );
}
