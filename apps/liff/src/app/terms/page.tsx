import { PageHeader } from "@/components/PageHeader";
import { TermsBody } from "@/components/legal/TermsBody";

export const metadata = { title: "利用規約 | OPTAS パートナー" };

export default function TermsPage() {
  return (
    <div className="pb-10">
      <PageHeader title="利用規約" />
      <main className="space-y-5 px-5 py-5 text-sm leading-relaxed text-ink">
        <TermsBody />
      </main>
    </div>
  );
}
