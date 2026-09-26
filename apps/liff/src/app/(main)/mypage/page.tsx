"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BankAccountDto, ReferrerProfileDto } from "@nesicle/shared";
import { BANK_ACCOUNT_TYPE_LABEL_JA } from "@nesicle/shared";
import { TopBar } from "@/components/TopBar";
import { IconChevronRight } from "@/components/icons";
import { useApiGet } from "@/lib/useApiGet";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { card } from "@/lib/ui";
import clsx from "clsx";

function Row({ href, title, value }: { href: string; title: string; value: string }) {
  return (
    <Link href={href} className={clsx(card, "flex items-center justify-between")}>
      <div>
        <p className="text-base text-ink-muted">{title}</p>
        <p className="mt-0.5 text-lg font-bold">{value}</p>
      </div>
      <IconChevronRight className="h-6 w-6 text-ink-muted" />
    </Link>
  );
}

export default function MyPage() {
  const { user, logout } = useSession();
  const router = useRouter();
  const { data: profile } = useApiGet<ReferrerProfileDto>("/api/me/profile");
  const { data: bankAccount } = useApiGet<BankAccountDto>("/api/me/bank-account");
  const { data: consent, reload: reloadConsent } = useApiGet<{ agreed: boolean }>("/api/me/consent");

  return (
    <div>
      <TopBar title="マイページ" subtitle={user?.displayName} />
      <main className="space-y-3 px-5 py-4">
        <Row href="/mypage/profile" title="プロフィール" value={profile?.fullName || "未登録・タップして登録"} />
        <Row
          href="/mypage/bank"
          title="振込先口座"
          value={
            bankAccount
              ? `${bankAccount.bankName} ${bankAccount.branchName} (${BANK_ACCOUNT_TYPE_LABEL_JA[bankAccount.accountType]})`
              : "未登録・タップして登録"
          }
        />

        <div className={card}>
          <p className="text-base text-ink-muted">利用規約への同意</p>
          {consent?.agreed ? (
            <p className="mt-0.5 text-lg font-bold text-success">同意済みです</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-base text-ink-muted">サービス利用には利用規約への同意が必要です。</p>
              <button
                type="button"
                onClick={async () => {
                  await api.post("/api/me/consent", { documentType: "TERMS", version: "1.0" });
                  reloadConsent();
                }}
                className="w-full rounded-md bg-primary px-3 py-2.5 text-base font-bold text-white"
              >
                同意する
              </button>
            </div>
          )}
          <div className="mt-3 flex gap-4 border-t border-border pt-3 text-base font-bold text-primary">
            <Link href="/terms">利用規約を見る</Link>
            <Link href="/privacy">プライバシーポリシーを見る</Link>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="w-full rounded-md border border-border py-3 text-base font-bold text-ink-muted"
        >
          ログアウト
        </button>
      </main>
    </div>
  );
}
