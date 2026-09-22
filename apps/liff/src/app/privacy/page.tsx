import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "プライバシーポリシー | ネシクル パートナー" };

export default function PrivacyPage() {
  return (
    <div className="pb-10">
      <PageHeader title="プライバシーポリシー" />
      <main className="space-y-5 px-5 py-5 text-sm leading-relaxed text-ink">
        <p className="text-xs text-ink-muted">最終改定日: 2026年9月18日(バージョン 1.0)</p>

        <section className="space-y-2">
          <h2 className="font-bold">1. 取得する情報</h2>
          <p>
            当社は、本サービスの提供にあたり、LINEアカウント情報(表示名・プロフィール画像等)、氏名・住所・電話番号・メールアドレス等の連絡先情報、振込先口座情報、および紹介・申込みに関する記録を取得します。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">2. 利用目的</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>本サービスの提供・運営のため</li>
            <li>紹介報酬の計算および支払いのため</li>
            <li>ユーザーからのお問い合わせに対応するため</li>
            <li>不正利用の防止のため</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">3. 第三者提供</h2>
          <p>
            当社は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。ただし、紹介された案件への申込みに際しては、申込者ご本人の入力・同意に基づき、申込内容が該当する掲載企業へ提供されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">4. 情報の管理</h2>
          <p>
            当社は、取得した個人情報を適切に管理し、不正アクセス・漏えい・滅失・毀損の防止に努めます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">5. 開示・訂正・削除</h2>
          <p>
            ユーザーは、当社が保有する自己の個人情報について、開示・訂正・削除を求めることができます。ご希望の場合は、本サービス内のお問い合わせ窓口までご連絡ください。
          </p>
        </section>

        <p className="rounded-md bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
          ※本ページはβ版における暫定的なプライバシーポリシーです。正式版は正式リリースまでに別途整備・掲示いたします。
        </p>
      </main>
    </div>
  );
}
