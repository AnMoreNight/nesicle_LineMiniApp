"use client";

import { useAdminAuth } from "@/lib/auth-context";

export function Topbar() {
  const { admin, logout } = useAdminAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-surface px-8">
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink">
          <span className="text-ink-muted">ログイン中: </span>
          <span className="font-medium">{admin.displayName}</span>
        </span>
        <button
          onClick={() => void logout()}
          className="rounded-sm px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
