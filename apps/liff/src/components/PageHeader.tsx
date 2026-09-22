"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "./icons";

export function PageHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-surface px-4 py-3.5">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted active:bg-surface-muted"
        aria-label="戻る"
      >
        <IconBack className="h-5 w-5" />
      </button>
      <p className="text-base font-bold">{title}</p>
    </header>
  );
}
