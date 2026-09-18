"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCartStore } from "@/lib/cartStore";
import { IconHome, IconList, IconLink, IconClock, IconWallet } from "./icons";

const ITEMS = [
  { href: "/", label: "ホーム", Icon: IconHome, match: (p: string) => p === "/" },
  { href: "/cases", label: "案件", Icon: IconList, match: (p: string) => p.startsWith("/cases") },
  { href: "/cart", label: "紹介", Icon: IconLink, match: (p: string) => p.startsWith("/cart") },
  { href: "/progress", label: "状況", Icon: IconClock, match: (p: string) => p.startsWith("/progress") },
  { href: "/rewards", label: "報酬", Icon: IconWallet, match: (p: string) => p.startsWith("/rewards") },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.items.length);

  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur">
      <div className="flex">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold",
                active ? "text-primary" : "text-ink-muted",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {href === "/cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-money px-1 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
