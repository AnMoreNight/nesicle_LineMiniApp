"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button, Card, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { CaseStatusBadge } from "@/components/StatusBadge";
import { CaseForm } from "@/components/CaseForm";
import type { CaseBase, CaseInput, CaseWithCompany, CompanyBase } from "@/types/admin";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const caseId = params.id;

  const [caseData, setCaseData] = useState<CaseWithCompany | null>(null);
  const [companies, setCompanies] = useState<CompanyBase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  function load() {
    setError(null);
    Promise.all([
      api.get<CaseWithCompany>(`/api/admin/cases/${caseId}`),
      api.get<CompanyBase[]>("/api/admin/companies"),
    ])
      .then(([c, comps]) => {
        setCaseData(c);
        setCompanies(comps);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "案件情報の取得に失敗しました。"));
  }

  useEffect(load, [caseId]);

  // PUT/publish/suspend all return the bare Case row (no `company` include — only the
  // initial GET includes it), so merge onto the previously loaded caseData instead of
  // replacing it, to avoid dropping `company` from state.
  async function handleSubmit(input: CaseInput) {
    const updated = await api.put<CaseBase>(`/api/admin/cases/${caseId}`, input);
    setCaseData((prev) => (prev ? { ...prev, ...updated } : (updated as CaseWithCompany)));
  }

  async function handlePublish() {
    setActionError(null);
    setActionPending(true);
    try {
      const updated = await api.post<CaseBase>(`/api/admin/cases/${caseId}/publish`);
      setCaseData((prev) => (prev ? { ...prev, status: updated.status } : (updated as CaseWithCompany)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "公開に失敗しました。");
    } finally {
      setActionPending(false);
    }
  }

  async function handleSuspend() {
    setActionError(null);
    setActionPending(true);
    try {
      const updated = await api.post<CaseBase>(`/api/admin/cases/${caseId}/suspend`);
      setCaseData((prev) => (prev ? { ...prev, status: updated.status } : (updated as CaseWithCompany)));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "停止に失敗しました。");
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("この案件を削除しますか?この操作は取り消せません。")) return;
    setActionError(null);
    setActionPending(true);
    try {
      await api.delete(`/api/admin/cases/${caseId}`);
      router.push("/cases");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "削除に失敗しました。");
      setActionPending(false);
    }
  }

  if (error) {
    return (
      <div>
        <PageHeader title="案件詳細" />
        <ErrorState message={error} />
      </div>
    );
  }

  if (!caseData || !companies) {
    return (
      <div>
        <PageHeader title="案件詳細" />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={caseData.title}
        actions={
          <>
            <CaseStatusBadge status={caseData.status} />
            {caseData.status !== "PUBLISHED" ? (
              <Button variant="primary" onClick={handlePublish} disabled={actionPending}>
                公開する
              </Button>
            ) : null}
            {caseData.status !== "SUSPENDED" ? (
              <Button variant="danger" onClick={handleSuspend} disabled={actionPending}>
                停止する
              </Button>
            ) : null}
            <Button variant="danger" onClick={handleDelete} disabled={actionPending}>
              削除する
            </Button>
          </>
        }
      />
      {actionError ? (
        <div className="mb-4">
          <ErrorState message={actionError} />
        </div>
      ) : null}
      <Card>
        <CaseForm
          companies={companies}
          initial={caseData}
          submitLabel="変更を保存"
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
