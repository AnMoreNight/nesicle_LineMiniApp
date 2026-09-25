"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import { completeLiffLoginIfPossible } from "./liff";
import { useCartStore } from "./cartStore";

export interface SessionUser {
  id: string;
  displayName: string;
  pictureUrl: string | null;
  hasCompleteProfile: boolean;
  hasBankAccount: boolean;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (): Promise<SessionUser | null> => {
    try {
      const me = await api.get<SessionUser>("/api/auth/me");
      setUser(me);
      // Load the server-persisted selection (cases checked but not yet issued as a link)
      // now that we know who's logged in — covers both initial load and a fresh login.
      useCartStore.getState().hydrate();
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    (async () => {
      try {
        // Runs on every page load, globally — see completeLiffLoginIfPossible's own comment
        // for why this can't just live on the /login page.
        await completeLiffLoginIfPossible();
      } catch (err) {
        console.error("[session] LIFF login completion attempt failed:", err);
      }
      await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  return <SessionContext.Provider value={{ user, loading, refresh, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
