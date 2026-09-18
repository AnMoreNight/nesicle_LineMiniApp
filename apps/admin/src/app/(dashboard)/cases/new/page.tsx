"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Card, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { CaseForm } from "@/components/CaseForm";
import type { CaseBase, CaseInput, CompanyBase } from "@/types/admin";

export default function NewCasePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyBase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CompanyBase[]>("/api/admin/companies")
      .then(setCompanies)
      .catch((err) => setError(err instanceof ApiError ? err.message : "掲載企業一覧の取得に失敗しました。"));
  }, []);

  async function handleSubmit(input: CaseInput) {
    const created = await api.post<CaseBase>("/api/admin/cases", input);
    router.replace(`/cases/${created.id}`);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="新規案件登録" />
      {error ? <ErrorState message={error} /> : null}
      {!error && !companies ? <LoadingState /> : null}
      {companies ? (
        companies.length === 0 ? (
          <ErrorState message="先に掲載企業を登録してください。" />
        ) : (
          <Card>
            <CaseForm companies={companies} submitLabel="案件を登録（下書き）" onSubmit={handleSubmit} />
          </Card>
        )
      ) : null}
    </div>
  );
}
