"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { PageSpinner } from "@/components/Spinner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  // 利用規約に同意するまでは、案件の閲覧・紹介URLの発行・コピーなどアプリの機能を使えないようにする
  const needsAgreement = user?.hasAgreedTerms === false;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (needsAgreement) {
      router.replace("/agree");
    }
  }, [loading, user, needsAgreement, router]);

  if (loading || !user || needsAgreement) {
    return <PageSpinner />;
  }

  return (
    <div className="pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
