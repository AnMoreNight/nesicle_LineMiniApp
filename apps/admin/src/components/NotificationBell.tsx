"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { ApplicationListItem } from "@/types/admin";

const POLL_INTERVAL_MS = 20_000;
const LAST_SEEN_KEY = "nesicle_admin_notifications_last_seen";
const MAX_NOTIFICATIONS = 20;
const TOAST_DURATION_MS = 6_000;

interface Toast {
  id: string;
  message: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ApplicationListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Persisted across sessions so a returning admin gets toasts for anything they missed,
  // instead of re-alerting on every application ever created.
  const lastSeenRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const fresh = await api.get<ApplicationListItem[]>(
          `/api/admin/applications?createdAfter=${encodeURIComponent(lastSeenRef.current)}`,
        );
        if (cancelled || fresh.length === 0) return;
        lastSeenRef.current = fresh[0].createdAt; // list is newest-first
        localStorage.setItem(LAST_SEEN_KEY, lastSeenRef.current);

        setNotifications((prev) => [...fresh, ...prev].slice(0, MAX_NOTIFICATIONS));
        setUnreadCount((prev) => prev + fresh.length);

        const newToasts = fresh.map((a) => ({
          id: a.id,
          message: `${a.applicant.fullName} さんが「${a.case.title}」に申込みました`,
        }));
        setToasts((prev) => [...newToasts, ...prev]);
        newToasts.forEach((t) => {
          setTimeout(() => {
            if (!cancelled) setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }, TOAST_DURATION_MS);
        });
      } catch {
        // silent — the next poll retries
      }
    }

    (async () => {
      // Seed the panel with recent applications for browsing (no toasts for these), then
      // start the cursor from either where we left off last session or from now, so a
      // brand-new admin isn't immediately blasted with every historical application as "new".
      const recent = await api.get<ApplicationListItem[]>("/api/admin/applications").catch(() => []);
      if (cancelled) return;
      setNotifications(recent.slice(0, MAX_NOTIFICATIONS));
      lastSeenRef.current = localStorage.getItem(LAST_SEEN_KEY) ?? recent[0]?.createdAt ?? new Date().toISOString();
      await poll();
    })();

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleToggle() {
    setOpen((prev) => !prev);
    setUnreadCount(0);
  }

  function handleSelect() {
    setOpen(false);
    router.push("/applications");
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        aria-label="通知"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button aria-label="閉じる" className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-card">
            <div className="border-b border-border px-4 py-3 text-sm font-bold text-ink">通知</div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">通知はありません</p>
              ) : (
                notifications.map((a) => (
                  <button
                    key={a.id}
                    onClick={handleSelect}
                    className="block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-muted"
                  >
                    <p className="text-sm font-medium text-ink">
                      {a.applicant.fullName} さんが「{a.case.title}」に申込みました
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(a.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="max-w-xs rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white shadow-float">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
