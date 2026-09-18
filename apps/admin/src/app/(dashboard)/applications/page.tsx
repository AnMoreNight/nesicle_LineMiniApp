"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PROGRESS_STATUS_LABEL_JA,
  REWARD_STATUS_LABEL_JA,
  type ProgressStatus,
  type RewardStatus,
} from "@nesicle/shared";
import { api, apiUrl, ApiError } from "@/lib/api";
import { formatDate, formatYen } from "@/lib/format";
import { ProgressStatusBadge, RewardStatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, Input, LinkButton, LoadingState, PageHeader, Select } from "@/components/ui";
import { ApplicationDrawer } from "@/components/ApplicationDrawer";
import type { ApplicationListItem, CaseWithCompany, ReferrerListItem } from "@/types/admin";

const PROGRESS_OPTIONS: ProgressStatus[] = ["APPLIED", "INTERVIEWING", "CONTRACTED", "INELIGIBLE"];
const REWARD_OPTIONS: RewardStatus[] = ["UNCONFIRMED", "CONFIRMED", "PAID"];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cases, setCases] = useState<CaseWithCompany[]>([]);
  const [referrers, setReferrers] = useState<ReferrerListItem[]>([]);

  const [progressStatus, setProgressStatus] = useState("");
  const [rewardStatus, setRewardStatus] = useState("");
  const [caseId, setCaseId] = useState("");
  const [referrerId, setReferrerId] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");

  const [selected, setSelected] = useState<ApplicationListItem | null>(null);

  // Filter option sources, fetched once.
  useEffect(() => {
    api.get<CaseWithCompany[]>("/api/admin/cases").then(setCases).catch(() => undefined);
    api.get<ReferrerListItem[]>("/api/admin/referrers").then(setReferrers).catch(() => undefined);
  }, []);

  // Debounce the free-text search box.
  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput), 350);
    return () => clearTimeout(timer);
  }, [qInput]);

  const query = useMemo(() => {
    const params: Record<string, string | undefined> = {
      progressStatus: progressStatus || undefined,
      rewardStatus: rewardStatus || undefined,
      caseId: caseId || undefined,
      referrerId: referrerId || undefined,
      q: q || undefined,
    };
    return params;
  }, [progressStatus, rewardStatus, caseId, referrerId, q]);

  useEffect(() => {
    setApplications(null);
    setError(null);
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) search.set(key, value);
    }
    const qs = search.toString();
    api
      .get<ApplicationListItem[]>(`/api/admin/applications${qs ? `?${qs}` : ""}`)
      .then(setApplications)
      .catch((err) => setError(err instanceof ApiError ? err.message : "申込一覧の取得に失敗しました。"));
  }, [query]);

  function handleUpdated(updated: ApplicationListItem) {
    setApplications((prev) => (prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev));
    setSelected(updated);
  }

  return (
    <div>
      <PageHeader
        title="申込管理"
        actions={<LinkButton href={apiUrl("/api/admin/applications/export.csv", query)}>CSVエクスポート</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={progressStatus} onChange={(e) => setProgressStatus(e.target.value)} className="w-auto">
          <option value="">すべての進捗状況</option>
          {PROGRESS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {PROGRESS_STATUS_LABEL_JA[s]}
            </option>
          ))}
        </Select>
        <Select value={rewardStatus} onChange={(e) => setRewardStatus(e.target.value)} className="w-auto">
          <option value="">すべての報酬状況</option>
          {REWARD_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {REWARD_STATUS_LABEL_JA[s]}
            </option>
          ))}
        </Select>
        <Select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="w-auto">
          <option value="">すべての案件</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <Select value={referrerId} onChange={(e) => setReferrerId(e.target.value)} className="w-auto">
          <option value="">すべての紹介者</option>
          {referrers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}
            </option>
          ))}
        </Select>
        <Input
          placeholder="申込者名で検索"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          className="w-52"
        />
      </div>

      {error ? <ErrorState message={error} /> : null}
      {!error && !applications ? <LoadingState /> : null}
      {applications && applications.length === 0 ? <EmptyState message="該当する申込がありません。" /> : null}

      {applications && applications.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-ink-muted">
                <th className="px-4 py-3 font-medium">申込者</th>
                <th className="px-4 py-3 font-medium">案件</th>
                <th className="px-4 py-3 font-medium">紹介者</th>
                <th className="px-4 py-3 font-medium">進捗</th>
                <th className="px-4 py-3 font-medium">報酬状況</th>
                <th className="px-4 py-3 font-medium">報酬額</th>
                <th className="px-4 py-3 font-medium">申込日</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                >
                  <td className="px-4 py-3 font-medium text-ink">{a.applicant.fullName}</td>
                  <td className="px-4 py-3">
                    <div>{a.case.title}</div>
                    <div className="text-ink-muted">{a.case.company.name}</div>
                  </td>
                  <td className="px-4 py-3">{a.referralLink.referrer.displayName}</td>
                  <td className="px-4 py-3">
                    <ProgressStatusBadge status={a.progressStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <RewardStatusBadge status={a.rewardStatus} />
                  </td>
                  <td className="px-4 py-3 text-money">{formatYen(a.rewardAmount)}</td>
                  <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected ? (
        <ApplicationDrawer application={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      ) : null}
    </div>
  );
}
