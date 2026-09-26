"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheckCircle } from "@/components/icons";

function CompleteContent() {
  const searchParams = useSearchParams();
  const count = searchParams.get("count");
  const id = searchParams.get("id");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
        <IconCheckCircle className="h-9 w-9" />
      </div>
      <p className="text-xl font-extrabold">お申し込みありがとうございました</p>
      <p className="mt-2 text-base leading-relaxed text-ink-muted">
        {count ? `${count}件のお申し込みを受け付けました。` : "お申し込みを受け付けました。"}
        <br />
        担当企業より、順次ご連絡いたします。
      </p>
      {id && <p className="mt-4 rounded-md bg-surface-muted px-3 py-2 text-base text-ink-muted">お問い合わせ番号: {id}</p>}
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteContent />
    </Suspense>
  );
}
