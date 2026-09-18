"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
}

interface AdminAuthContextValue {
  admin: AdminUser;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * Client-side auth guard for the authenticated shell. The API's session cookie is scoped to
 * the API origin, so there is no server-side way to know if the visitor is logged in — this
 * checks GET /api/admin/auth/me on mount and redirects to /login on 401.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AdminUser>("/api/admin/auth/me")
      .then((data) => {
        if (cancelled) return;
        setAdmin(data);
        setChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await api.post("/api/admin/auth/logout");
    } finally {
      router.replace("/login");
    }
  }

  if (!checked || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-ink-muted">
        読み込み中...
      </div>
    );
  }

  return <AdminAuthContext.Provider value={{ admin, logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return ctx;
}
