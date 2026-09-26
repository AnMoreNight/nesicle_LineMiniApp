"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { IconHome, IconList, IconLink, IconClock, IconWallet } from "./icons";

const ITEMS = [
  { href: "/", label: "ホーム", Icon: IconHome, match: (p: string) => p === "/" },
  { href: "/cases", label: "案件", Icon: IconList, match: (p: string) => p.startsWith("/cases") },
  { href: "/refer", label: "紹介", Icon: IconLink, match: (p: string) => p.startsWith("/refer") },
  { href: "/progress", label: "状況", Icon: IconClock, match: (p: string) => p.startsWith("/progress") },
  { href: "/rewards", label: "報酬", Icon: IconWallet, match: (p: string) => p.startsWith("/rewards") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface">
      <div className="flex">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={clsx(
                "relative flex flex-1 items-center justify-center py-3.5",
                active ? "text-primary" : "text-ink-muted",
              )}
            >
              <Icon className="h-8 w-8" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
