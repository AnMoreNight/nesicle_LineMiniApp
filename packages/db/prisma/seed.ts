import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_REFERRER_LINE_USER_ID = "dev-demo-referrer";

async function main() {
  console.log("Seeding database...");

  // --- Admin user ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@nesicle.jp";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: "運営管理者",
    },
  });

  // --- Companies ---
  const nursingCo = await prisma.company.create({
    data: {
      name: "ケアキャリア株式会社",
      contactName: "採用担当 中村",
      contactEmail: "nakamura@example-carecareer.jp",
      contactPhone: "03-1234-5678",
    },
  });
  const carCo = await prisma.company.create({
    data: {
      name: "カーバリュー買取センター",
      contactName: "営業 加藤",
      contactEmail: "kato@example-carvalue.jp",
      contactPhone: "03-2345-6789",
    },
  });
  const insuranceCo = await prisma.company.create({
    data: {
      name: "みらい保険サービス",
      contactName: "代理店窓口",
      contactEmail: "contact@example-mirai-hoken.jp",
      contactPhone: "03-3456-7890",
    },
  });
  const movingCo = await prisma.company.create({
    data: {
      name: "スムーズ引越センター",
      contactName: "法人窓口",
      contactEmail: "contact@example-smooth-moving.jp",
      contactPhone: "03-4567-8901",
    },
  });
  const realEstateCo = await prisma.company.create({
    data: {
      name: "東京不動産パートナーズ",
      contactName: "売却相談窓口",
      contactEmail: "contact@example-tokyo-fudosan.jp",
      contactPhone: "03-5678-9012",
    },
  });

  // --- Cases ---
  const caseNursing = await prisma.case.create({
    data: {
      companyId: nursingCo.id,
      title: "看護師の転職相談",
      category: "転職",
      area: "全国対応",
      summary: "知人へ専用URLを送るだけ。ご本人が内容を確認し、希望する企業へ申込みます。",
      description:
        "看護師資格をお持ちの方向けの転職支援サービスです。専任のキャリアアドバイザーが非公開求人を含めご紹介します。",
      eligibilityNotes: "看護師・准看護師資格をお持ちで、転職を検討している方が対象です。",
      ineligibleNotes: "過去1年以内に同一サービスへ登録済みの方は対象外となる場合があります。",
      rewardTimingNotes: "ご紹介者が転職先と正式に契約(入社)した時点で報酬が確定します。",
      rewardLabel: "最大 80,000円",
      rewardAmount: 80000,
      status: "PUBLISHED",
    },
  });
  const caseCar = await prisma.case.create({
    data: {
      companyId: carCo.id,
      title: "車を売りたい方のご紹介",
      category: "車買取",
      area: "一都三県",
      summary: "紹介されたご本人が専用ページから査定希望を入力します。",
      description: "出張査定・即日現金化に対応した車買取サービスです。",
      eligibilityNotes: "一都三県(東京・神奈川・千葉・埼玉)にお住まいの方が対象です。",
      ineligibleNotes: "事故車・水没車など一部条件により査定不可の場合があります。",
      rewardTimingNotes: "売買契約成立時点で報酬が確定します。",
      rewardLabel: "20,000円〜",
      rewardAmount: 20000,
      status: "PUBLISHED",
    },
  });
  const caseInsurance = await prisma.case.create({
    data: {
      companyId: insuranceCo.id,
      title: "保険の見直し相談",
      category: "保険",
      area: "全国・オンライン相談",
      summary: "無料のオンライン相談で保険の見直しを提案します。",
      description: "生命保険・医療保険を中心に、ファイナンシャルプランナーが無料でご相談に応じます。",
      eligibilityNotes: "既に他社サービスで相談済みでない方が対象です。",
      ineligibleNotes: "既存顧客として登録済みの方は対象外です。",
      rewardTimingNotes: "初回オンライン相談の実施をもって報酬が確定します。",
      rewardLabel: "15,000円",
      rewardAmount: 15000,
      status: "PUBLISHED",
    },
  });
  const caseMoving = await prisma.case.create({
    data: {
      companyId: movingCo.id,
      title: "引越し見積もり",
      category: "引越し",
      area: "全国対応",
      summary: "複数社の引越し見積もりを一度の入力でまとめて依頼できます。",
      description: "引越し希望日・荷物量などを入力するだけで最短即日に見積もりが届きます。",
      eligibilityNotes: "1ヶ月以内に引越しを予定している方が対象です。",
      ineligibleNotes: "法人契約・海外引越しは対象外です。",
      rewardTimingNotes: "見積もり依頼の完了をもって報酬が確定します。",
      rewardLabel: "5,000円〜",
      rewardAmount: 5000,
      status: "PUBLISHED",
    },
  });
  const caseRealEstate = await prisma.case.create({
    data: {
      companyId: realEstateCo.id,
      title: "不動産売却相談",
      category: "不動産",
      area: "首都圏",
      summary: "無料査定から売却までワンストップでサポートします。",
      description: "首都圏の戸建て・マンションを対象に、無料査定と売却サポートを提供します。",
      eligibilityNotes: "首都圏(東京・神奈川・千葉・埼玉)に物件をお持ちの方が対象です。",
      ineligibleNotes: "既に他社と専任媒介契約中の物件は対象外です。",
      rewardTimingNotes: "媒介契約の締結をもって報酬が確定します。",
      rewardLabel: "50,000円〜",
      rewardAmount: 50000,
      status: "PUBLISHED",
    },
  });
  // A draft case, to exercise the admin publish workflow.
  await prisma.case.create({
    data: {
      companyId: nursingCo.id,
      title: "薬剤師の転職相談(準備中)",
      category: "転職",
      area: "全国対応",
      summary: "近日公開予定の案件です。",
      description: "薬剤師資格をお持ちの方向けの転職支援サービスです。",
      rewardLabel: "最大 60,000円",
      rewardAmount: 60000,
      status: "DRAFT",
    },
  });

  // --- Demo referrer ---
  const demoUser = await prisma.user.upsert({
    where: { lineUserId: DEMO_REFERRER_LINE_USER_ID },
    update: {},
    create: {
      lineUserId: DEMO_REFERRER_LINE_USER_ID,
      displayName: "宮本 さくら",
      pictureUrl: null,
    },
  });
  const demoProfile = await prisma.referrerProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      fullName: "宮本 さくら",
      phone: "090-1111-2222",
      email: "miyamoto.sakura@example.com",
      postalCode: "150-0001",
      address: "東京都渋谷区神宮前1-1-1",
    },
  });
  await prisma.bankAccount.upsert({
    where: { referrerProfileId: demoProfile.id },
    update: {},
    create: {
      referrerProfileId: demoProfile.id,
      bankName: "みずほ銀行",
      branchName: "渋谷支店",
      accountType: "ORDINARY",
      accountNumber: "1234567",
      accountHolder: "ミヤモト サクラ",
    },
  });
  await prisma.consentRecord.create({
    data: {
      subjectType: "REFERRER",
      subjectId: demoUser.id,
      documentType: "TERMS",
      version: "1.0",
    },
  });

  // --- Referral links + applications for the demo referrer, spanning every status ---
  const link1 = await prisma.referralLink.create({
    data: {
      code: "PT-DEMO01",
      referrerId: demoUser.id,
      cases: { create: [{ caseId: caseNursing.id }] },
    },
  });
  const link2 = await prisma.referralLink.create({
    data: {
      code: "PT-DEMO02",
      referrerId: demoUser.id,
      cases: { create: [{ caseId: caseCar.id }, { caseId: caseInsurance.id }] },
    },
  });
  const link3 = await prisma.referralLink.create({
    data: {
      code: "PT-DEMO03",
      referrerId: demoUser.id,
      cases: { create: [{ caseId: caseInsurance.id }] },
    },
  });

  const yamada = await prisma.applicant.create({
    data: {
      fullName: "山田 花子",
      birthDate: new Date("1990-04-12"),
      postalCode: "220-0011",
      address: "神奈川県横浜市西区高島1-1-1",
      phone: "090-2222-3333",
      email: "yamada.hanako@example.com",
    },
  });
  await prisma.application.create({
    data: {
      applicantId: yamada.id,
      caseId: caseNursing.id,
      referralLinkId: link1.id,
      progressStatus: "INTERVIEWING",
      rewardStatus: "UNCONFIRMED",
    },
  });

  const sato = await prisma.applicant.create({
    data: {
      fullName: "佐藤 太郎",
      birthDate: new Date("1985-11-03"),
      postalCode: "260-0013",
      address: "千葉県千葉市中央区中央1-1-1",
      phone: "090-3333-4444",
      email: "sato.taro@example.com",
    },
  });
  await prisma.application.create({
    data: {
      applicantId: sato.id,
      caseId: caseCar.id,
      referralLinkId: link2.id,
      progressStatus: "CONTRACTED",
      rewardStatus: "CONFIRMED",
      rewardAmount: 20000,
    },
  });
  await prisma.application.create({
    data: {
      applicantId: sato.id,
      caseId: caseInsurance.id,
      referralLinkId: link2.id,
      progressStatus: "APPLIED",
      rewardStatus: "UNCONFIRMED",
    },
  });

  const suzuki = await prisma.applicant.create({
    data: {
      fullName: "鈴木 一郎",
      birthDate: new Date("1978-02-20"),
      postalCode: "330-0801",
      address: "埼玉県さいたま市大宮区仲町1-1-1",
      phone: "090-4444-5555",
      email: "suzuki.ichiro@example.com",
    },
  });
  await prisma.application.create({
    data: {
      applicantId: suzuki.id,
      caseId: caseInsurance.id,
      referralLinkId: link3.id,
      progressStatus: "INELIGIBLE",
      rewardStatus: "UNCONFIRMED",
      ineligibleReason: "既存顧客のため対象外",
    },
  });

  const takahashi = await prisma.applicant.create({
    data: {
      fullName: "高橋 実",
      birthDate: new Date("1993-07-08"),
      postalCode: "150-0002",
      address: "東京都渋谷区渋谷1-1-1",
      phone: "090-5555-6666",
      email: "takahashi.minoru@example.com",
    },
  });
  await prisma.application.create({
    data: {
      applicantId: takahashi.id,
      caseId: caseNursing.id,
      referralLinkId: link1.id,
      progressStatus: "CONTRACTED",
      rewardStatus: "PAID",
      rewardAmount: 60000,
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Demo referrer LINE user id (for dev login): ${DEMO_REFERRER_LINE_USER_ID}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
