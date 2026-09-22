import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "利用規約 | ネシクル パートナー" };

export default function TermsPage() {
  return (
    <div className="pb-10">
      <PageHeader title="利用規約" />
      <main className="space-y-5 px-5 py-5 text-sm leading-relaxed text-ink">
        <p className="text-xs text-ink-muted">最終改定日: 2026年9月18日(バージョン 1.0)</p>

        <section className="space-y-2">
          <h2 className="font-bold">第1条(適用)</h2>
          <p>
            本規約は、株式会社ネシクル(以下「当社」といいます)が提供する紹介マーケティングサービス「ネシクル
            パートナー」(以下「本サービス」といいます)の利用条件を定めるものです。本サービスを利用する紹介者(以下「ユーザー」といいます)は、本規約に同意のうえ本サービスを利用するものとします。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">第2条(紹介の仕組みと報酬)</h2>
          <p>
            ユーザーは、当社が提供する専用の紹介URLを通じて、当社の掲載企業が提供するサービスを第三者に紹介できます。紹介を通じて成約その他の成果条件が満たされた場合、当社が定める基準に基づき紹介報酬が発生します。報酬の発生条件・金額・確定時期は、各案件の詳細ページに記載する内容によります。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">第3条(禁止事項)</h2>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>虚偽の情報を登録する行為</li>
            <li>紹介先の同意なく個人情報を取得・提供する行為</li>
            <li>不正な手段により紹介報酬を得ようとする行為</li>
            <li>当社または第三者の権利を侵害する行為</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">第4条(報酬の支払い)</h2>
          <p>
            確定した紹介報酬は、ユーザーが登録した振込先口座へ、当社が定める支払サイクルに基づき支払われます。振込先口座情報に誤りがあったことにより生じた損害について、当社は責任を負いません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">第5条(サービスの変更・中断・終了)</h2>
          <p>
            当社は、ユーザーへの事前の通知なく、本サービスの内容を変更し、または提供を中断・終了することがあります。これにより生じた損害について、当社は責任を負いません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">第6条(規約の変更)</h2>
          <p>
            当社は、必要と判断した場合、ユーザーへの通知をもって本規約を変更できるものとします。変更後の規約は、本サービス上に掲示した時点から効力を生じるものとします。
          </p>
        </section>

        <p className="rounded-md bg-surface-muted px-3 py-2.5 text-xs text-ink-muted">
          ※本ページはβ版における暫定的な利用規約です。正式版は正式リリースまでに別途整備・掲示いたします。
        </p>
      </main>
    </div>
  );
}
