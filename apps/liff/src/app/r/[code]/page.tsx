"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReferralLandingDto } from "@nesicle/shared";
import { PageSpinner } from "@/components/Spinner";
import { MoneyText } from "@/components/MoneyText";
import { EmptyState } from "@/components/EmptyState";
import { useApiGet } from "@/lib/useApiGet";
import { btnPrimary, card } from "@/lib/ui";
import clsx from "clsx";

export default function ReferralLandingPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data, loading, error } = useApiGet<ReferralLandingDto>(`/api/r/${code}`);

  if (loading) return <PageSpinner />;

  if (error || !data) {
    return (
      <div className="px-6 py-16">
        <EmptyState icon="🔗" title="紹介URLが見つかりません" description={error ?? "URLをご確認ください。"} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="mb-6 text-center">
        <p className="text-lg font-extrabold">ネシクル</p>
      </div>

      <div className="rounded-lg bg-primary-soft px-4 py-3 text-sm font-bold text-primary">
        {data.referrerDisplayName} さんから紹介が届いています
      </div>

      <p className="mb-3 mt-6 text-sm font-extrabold text-ink-muted">紹介されたサービス</p>
      <div className="space-y-3">
        {data.cases.map((c) => (
          <div key={c.id} className={card}>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">{c.category}</span>
              <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-bold text-ink-muted">{c.area}</span>
            </div>
            <p className="mt-2 text-sm font-bold">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.summary}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-md bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
        ご入力いただく個人情報は、紹介者(ネシクル パートナー)には共有されません。内容をご確認のうえ、ご自身でお申し込みください。
      </p>

      <button type="button" onClick={() => router.push(`/r/${code}/apply`)} className={clsx(btnPrimary, "mt-6 w-full")}>
        内容を確認して申し込む
      </button>
    </div>
  );
}
