"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  PROGRESS_STATUS_LABEL_JA,
  REWARD_STATUS_LABEL_JA,
  type ProgressStatus,
  type RewardStatus,
} from "@nesicle/shared";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { ApplicationListItem, ApplicationUpdateInput } from "@/types/admin";

const PROGRESS_OPTIONS: ProgressStatus[] = ["APPLIED", "INTERVIEWING", "CONTRACTED", "INELIGIBLE"];
const REWARD_OPTIONS: RewardStatus[] = ["UNCONFIRMED", "CONFIRMED", "PAID"];

interface ApplicationDrawerProps {
  application: ApplicationListItem;
  onClose: () => void;
  onUpdated: (updated: ApplicationListItem) => void;
}

export function ApplicationDrawer({ application, onClose, onUpdated }: ApplicationDrawerProps) {
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>(application.progressStatus);
  const [rewardStatus, setRewardStatus] = useState<RewardStatus>(application.rewardStatus);
  const [rewardAmount, setRewardAmount] = useState<string>(
    application.rewardAmount === null || application.rewardAmount === undefined ? "" : String(application.rewardAmount),
  );
  const [ineligibleReason, setIneligibleReason] = useState(application.ineligibleReason ?? "");
  const [internalNotes, setInternalNotes] = useState(application.internalNotes);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProgressStatus(application.progressStatus);
    setRewardStatus(application.rewardStatus);
    setRewardAmount(
      application.rewardAmount === null || application.rewardAmount === undefined
        ? ""
        : String(application.rewardAmount),
    );
    setIneligibleReason(application.ineligibleReason ?? "");
    setInternalNotes(application.internalNotes);
    setError(null);
  }, [application]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const payload: ApplicationUpdateInput = {
      progressStatus,
      rewardStatus,
      rewardAmount: rewardAmount.trim() === "" ? null : Number(rewardAmount),
      ineligibleReason: progressStatus === "INELIGIBLE" ? ineligibleReason.trim() || null : null,
      internalNotes,
    };
    try {
      const updated = await api.patch<ApplicationListItem>(`/api/admin/applications/${application.id}`, payload);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="閉じる"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface p-6 shadow-card">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{application.applicant.fullName}</h2>
            <p className="text-sm text-ink-muted">{application.case.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            閉じる
          </button>
        </div>

        <dl className="mb-6 space-y-2 text-sm">
          <Row label="掲載企業" value={application.case.company.name} />
          <Row
            label="紹介者"
            value={
              <Link href={`/referrers/${application.referralLink.referrer.id}`} className="text-primary hover:underline">
                {application.referralLink.referrer.displayName}
              </Link>
            }
          />
          <Row
            label="申込者"
            value={
              <Link href={`/applicants/${application.applicant.id}`} className="text-primary hover:underline">
                {application.applicant.fullName}
              </Link>
            }
          />
          <Row label="申込日" value={formatDate(application.createdAt)} />
          <Row label="最終更新" value={formatDateTime(application.updatedAt)} />
        </dl>

        <div className="space-y-4">
          <Field label="進捗状況">
            <Select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value as ProgressStatus)}>
              {PROGRESS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {PROGRESS_STATUS_LABEL_JA[s]}
                </option>
              ))}
            </Select>
          </Field>

          {progressStatus === "INELIGIBLE" ? (
            <Field label="対象外理由">
              <Textarea
                rows={3}
                maxLength={500}
                value={ineligibleReason}
                onChange={(e) => setIneligibleReason(e.target.value)}
              />
            </Field>
          ) : null}

          <Field label="報酬状況">
            <Select value={rewardStatus} onChange={(e) => setRewardStatus(e.target.value as RewardStatus)}>
              {REWARD_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {REWARD_STATUS_LABEL_JA[s]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="報酬額（円）" hint="未確定の場合は空欄のままにできます">
            <Input
              type="number"
              min={0}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
            />
          </Field>

          <Field label="社内メモ" hint="申込者・紹介者には表示されません">
            <Textarea rows={4} maxLength={2000} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "保存中..." : "変更を保存"}
            </Button>
            <Button variant="secondary" onClick={onClose} type="button">
              キャンセル
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
