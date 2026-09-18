"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";
import { CompanyForm } from "@/components/CompanyForm";
import type { CompanyBase, CompanyInput } from "@/types/admin";

export default function NewCompanyPage() {
  const router = useRouter();

  async function handleSubmit(input: CompanyInput) {
    const created = await api.post<CompanyBase>("/api/admin/companies", input);
    router.replace(`/companies/${created.id}`);
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="新規企業登録" />
      <Card>
        <CompanyForm submitLabel="登録する" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
