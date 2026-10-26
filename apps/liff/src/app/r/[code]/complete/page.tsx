"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheckCircle } from "@/components/icons";

function CompleteContent() {
  const searchParams = useSearchParams();
  const count = searchParams.get("count");
  const titles = searchParams.getAll("t");
  const numbers = searchParams.getAll("no").map((no, i) => ({ no, title: titles[i] ?? "" }));
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
      {numbers.length > 0 && (
        <div className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-3 text-left">
          <p className="text-xs text-ink-muted">お問い合わせ番号</p>
          <ul className="mt-1 divide-y divide-border">
            {numbers.map(({ no, title }) => (
              <li key={no} className="py-1.5">
                <p className="text-lg font-bold tracking-wider tabular-nums">{no}</p>
                {title && <p className="text-sm text-ink-muted">{title}</p>}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            {emailSent && "ご入力のメールアドレスに受付完了メールをお送りしました。"}
            お問い合わせの際は、該当するサービスの番号をお伝えください。
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
