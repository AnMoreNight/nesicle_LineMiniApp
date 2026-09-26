"use client";

import { useState } from "react";
import { useAdminAuth } from "@/lib/auth-context";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { NotificationBell } from "@/components/NotificationBell";

export function Topbar() {
  const { admin, logout } = useAdminAuth();
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-surface px-8">
      <div className="flex items-center gap-4">
        <NotificationBell />
        <span className="text-sm text-ink">
          <span className="text-ink-muted">ログイン中: </span>
          <span className="font-medium">{admin.displayName}</span>
        </span>
        <button
          onClick={() => setChangingPassword(true)}
          className="rounded-sm px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          パスワード変更
        </button>
        <button
          onClick={() => void logout()}
          className="rounded-sm px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          ログアウト
        </button>
      </div>
      {changingPassword ? <ChangePasswordModal onClose={() => setChangingPassword(false)} /> : null}
    </header>
  );
}
