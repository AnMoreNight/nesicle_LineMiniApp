"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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

// Auto-logout after this long with no interaction (mouse/touch/keyboard/scroll), so a
// forgotten/shared device doesn't stay logged in indefinitely.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const IDLE_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"] as const;

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  // Idle-timeout auto-logout — only active while actually logged in.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleIdle = () => {
      logoutRef.current().then(() => router.replace("/login"));
    };
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    };

    resetTimer();
    IDLE_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    return () => {
      clearTimeout(timeoutId);
      IDLE_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user, router]);

  return <SessionContext.Provider value={{ user, loading, refresh, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
