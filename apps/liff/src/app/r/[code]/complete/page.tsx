"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheckCircle } from "@/components/icons";

function CompleteContent() {
  const searchParams = useSearchParams();
  const count = searchParams.get("count");
  const inquiryNumber = searchParams.get("no");
  const emailSent = searchParams.get("mail") === "1";

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
      {inquiryNumber && (
        <div className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-3">
          <p className="text-xs text-ink-muted">お問い合わせ番号</p>
          <p className="mt-0.5 text-2xl font-bold tracking-wider tabular-nums">{inquiryNumber}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            {emailSent && "ご入力のメールアドレスに受付完了メールをお送りしました。"}
            お問い合わせの際に必要となりますので、お控えください。
          </p>
        </div>
      )}
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
