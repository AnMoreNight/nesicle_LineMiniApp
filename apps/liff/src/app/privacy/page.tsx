import { PageHeader } from "@/components/PageHeader";
import { PrivacyBody } from "@/components/legal/PrivacyBody";

export const metadata = { title: "プライバシーポリシー | OPTAS パートナー" };

export default function PrivacyPage() {
  return (
    <div className="pb-10">
      <PageHeader title="プライバシーポリシー" />
      <main className="space-y-5 px-5 py-5 text-sm leading-relaxed text-ink">
        <PrivacyBody />
      </main>
    </div>
  );
}
