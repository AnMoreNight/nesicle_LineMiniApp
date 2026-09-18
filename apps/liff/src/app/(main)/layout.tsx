"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { PageSpinner } from "@/components/Spinner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageSpinner />;
  }

  return (
    <div className="pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
