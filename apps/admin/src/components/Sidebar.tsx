"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/applications", label: "申込管理" },
  { href: "/cases", label: "案件管理" },
  { href: "/companies", label: "掲載企業" },
  { href: "/referrers", label: "紹介者" },
  { href: "/applicants", label: "応募者" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-ink py-6">
      <div className="mb-8 px-6">
        <span className="text-lg font-extrabold tracking-wide text-white">ネシクル管理</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
