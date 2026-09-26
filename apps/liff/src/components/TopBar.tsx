"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { IconUser } from "./icons";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface px-5 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">{title}</p>
          {subtitle && <p className="mt-0.5 text-base text-ink-muted">{subtitle}</p>}
        </div>
        <Link
          href="/mypage"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-ink-muted"
          aria-label="マイページ"
        >
          {user?.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.pictureUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <IconUser className="h-5 w-5" />
          )}
        </Link>
      </div>
    </header>
  );
}
