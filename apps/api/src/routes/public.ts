import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Applicant, type Prisma } from "@nesicle/db";
import {
  formatInquiryNumber,
  type ApplyResultDto,
  type ReferralLandingDto,
  type ReturningApplicantDto,
} from "@nesicle/shared";
import { applicantFacingTitle, serializeLandingCase } from "../lib/serialize.js";
import { notifyReferrer } from "../lib/lineNotify.js";
import { sendEmail } from "../lib/mailer.js";
import { buildApplicationReceivedEmail } from "../lib/applicationEmail.js";
import { isActiveApplication, normalizeEmail, normalizePhone, planApplications } from "../lib/applicantIdentity.js";
import { clearApplicantCookie, readApplicantCookie, setApplicantCookie } from "../lib/applicantCookie.js";
import { applicantHasAgreed, recordApplicantConsent } from "../lib/consent.js";

type Tx = Prisma.TransactionClient;

const WITH_APPLICATIONS = {
  applications: { select: { caseId: true, inquirySeq: true, progressStatus: true } },
} as const;

const jstDate = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const contactSchema = z.object({
  fullName: z.string().min(1).max(60),
  postalCode: z.string().max(10).default(""),
  address: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  email: z.string().email(),
});

// 申込者の登録(初回のみ): 連絡先と、利用規約・プライバシーポリシーへの同意
const registerSchema = contactSchema.extend({ agreedTerms: z.literal(true) });

// 登録済みの方の申込(紹介ページから)。申込者はこの端末の目印(Cookie)で判別する。
const applySchema = z.object({
  caseIds: z.array(z.string().min(1)).min(1, "申込先を1件以上選択してください。"),
  notes: z.string().max(2000).default(""),
});

const NOT_REGISTERED = "お申し込みの前に、お名前・ご連絡先のご登録をお願いします。";

async function toReturningApplicant(
  a: Applicant & { applications: { caseId: string; progressStatus: string }[] },
): Promise<ReturningApplicantDto> {
  return {
    fullName: a.fullName,
    postalCode: a.postalCode,
    address: a.address,
    phone: a.phone,
    email: a.email,
    agreedTerms: await applicantHasAgreed(a.id),
    appliedCaseIds: [...new Set(a.applications.filter((x) => isActiveApplication(x.progressStatus)).map((x) => x.caseId))],
  };
}

/**
 * 連絡先から申込者を登録(以前に登録・申込のある方なら更新)し、同意を記録する。
 * 同じ方の判定:
 * 1. この端末の目印(Cookie)の申込者と、メールか電話のどちらかが一致(片方を変えた場合も同じ方)。
 *    両方違えば、同じ端末を使う別の方として扱う。
 * 2. 目印がない・一致しない場合は、メールアドレスと電話番号が両方一致する申込者(古い方を優先)。
 */
async function upsertApplicant(tx: Tx, contact: z.infer<typeof contactSchema>, cookieApplicantId: string | null) {
  const emailKey = normalizeEmail(contact.email);
  const phoneKey = normalizePhone(contact.phone);
  // 同じ方(メール+電話)からの同時送信で二重に登録されないよう、この方の処理だけ順番に行う
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`applicant:${emailKey}|${phoneKey}`}))`;

  const fromCookie = cookieApplicantId ? await tx.applicant.findUnique({ where: { id: cookieApplicantId } }) : null;
  const cookieMatch =
    fromCookie && (normalizeEmail(fromCookie.email) === emailKey || normalizePhone(fromCookie.phone) === phoneKey)
      ? fromCookie
      : null;
  const existing =
    cookieMatch ??
    (
      await tx.applicant.findMany({
        where: { email: { equals: emailKey, mode: "insensitive" } },
        orderBy: { createdAt: "asc" },
      })
    ).find((a) => normalizePhone(a.phone) === phoneKey) ??
    null;

  const data = {
    fullName: contact.fullName,
    postalCode: contact.postalCode,
    address: contact.address,
    phone: contact.phone,
    email: contact.email,
  };
  // 連絡先は最新の入力にそろえる(引っ越し・電話番号の変更等)
  const applicant = existing
    ? await tx.applicant.update({ where: { id: existing.id }, data })
    : await tx.applicant.create({ data });
  await recordApplicantConsent(applicant.id, tx);
  return applicant;
}

/**
 * 選ばれた案件の申込を作る。同じ案件に申し込み済み(対応中・成約済み)なら新しく作らず、既存の番号を返す。
 * 希望内容は前回分を残し、日付つきで申込者に追記する。
 */
async function createApplications(
  tx: Tx,
  applicantId: string,
  referralLinkId: string,
  selectedCases: Parameters<typeof applicantFacingTitle>[0][],
  notes: string,
  receivedAt: Date,
) {
  // 同じ方の申込は順番に処理する(連番・重複の判定がずれないように)
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`apply:${applicantId}`}))`;
  const applicant = await tx.applicant.findUniqueOrThrow({ where: { id: applicantId }, include: WITH_APPLICATIONS });
  const planned = planApplications(selectedCases, applicant.applications);

  const note = notes.trim();
  if (note) {
    await tx.applicant.update({
      where: { id: applicantId },
      data: {
        notes: [applicant.notes, `【${jstDate.format(receivedAt)} のお申し込み】\n${note}`].filter(Boolean).join("\n\n"),
      },
    });
  }

  const toCreate = planned.filter((p) => !p.alreadyApplied);
  if (toCreate.length > 0) {
    await tx.application.createMany({
      data: toCreate.map((p) => ({ applicantId, caseId: p.case.id, referralLinkId, inquirySeq: p.seq })),
    });
  }
  return { applicant, planned };
}

export default async function publicRoutes(app: FastifyInstance) {
  app.get("/api/r/:code", async (request, reply) => {
    const { code } = request.params as { code: string };
    const link = await prisma.referralLink.findUnique({
      where: { code },
      include: {
        referrer: true,
        cases: { include: { case: { include: { company: true } } } },
      },
    });
    if (!link) {
      return reply.code(404).send({ error: "紹介URLが見つかりません。" });
    }
    const publishedCases = link.cases.map((rc) => rc.case).filter((c) => c.status === "PUBLISHED");
    if (publishedCases.length === 0) {
      return reply.code(410).send({ error: "この紹介URLの案件は現在受付を停止しています。" });
    }
    const dto: ReferralLandingDto = {
      referrerDisplayName: link.referrer.displayName,
      cases: publishedCases.map(serializeLandingCase),
    };
    return dto;
  });

  // この端末で登録・申込をした方(目印のCookieがなければ null)。登録済みなら紹介ページから直接申し込め、
  // 同意済みの規約・申し込み済みの案件はもう一度求めない。登録内容の変更画面の入力補完にも使う。
  app.get("/api/applicant/me", async (request) => {
    const id = readApplicantCookie(request);
    const a = id ? await prisma.applicant.findUnique({ where: { id }, include: WITH_APPLICATIONS }) : null;
    return { applicant: a ? await toReturningApplicant(a) : null };
  });

  // 「別の方の情報で入力」: この端末の目印を消し、次回から入力補完しない
  app.delete("/api/applicant/me", async (_request, reply) => {
    clearApplicantCookie(reply);
    return { ok: true };
  });

  // 申込者の登録・登録内容の変更。この端末に目印を付け、以降は紹介ページから直接申し込めるようにする。
  app.post("/api/applicant", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const saved = await prisma.$transaction((tx) => upsertApplicant(tx, parsed.data, readApplicantCookie(request)));
    setApplicantCookie(reply, saved.id);
    const a = await prisma.applicant.findUniqueOrThrow({ where: { id: saved.id }, include: WITH_APPLICATIONS });
    return { applicant: await toReturningApplicant(a) };
  });

  app.post("/api/r/:code/apply", async (request, reply) => {
    const { code } = request.params as { code: string };
    const parsed = applySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }

    const link = await prisma.referralLink.findUnique({
      where: { code },
      include: { cases: { include: { case: { include: { company: true } } } } },
    });
    if (!link) {
      return reply.code(404).send({ error: "紹介URLが見つかりません。" });
    }
    const bundledCases = new Map(link.cases.map((rc) => [rc.caseId, rc.case]));
    // 選択順の並びをDB登録・メール・レスポンスで共通に使う。
    const selectedCases = [...new Set(parsed.data.caseIds)]
      .filter((id) => bundledCases.has(id))
      .map((id) => bundledCases.get(id)!);
    if (selectedCases.length === 0) {
      return reply.code(400).send({ error: "この紹介URLに含まれる案件を選択してください。" });
    }

    const cookieApplicantId = readApplicantCookie(request);
    // 以前の画面(デプロイの切り替わり中)は、連絡先と同意も一緒に送ってくる。その場合は登録してから申し込む。
    const withContact = registerSchema.safeParse(request.body);
    const receivedAt = new Date();

    const done = await prisma.$transaction(async (tx) => {
      let applicantId: string;
      if (withContact.success) {
        applicantId = (await upsertApplicant(tx, withContact.data, cookieApplicantId)).id;
      } else {
        // 登録済み(この端末の目印があり、同意済み)の方だけ受け付ける
        const registered = cookieApplicantId
          ? await tx.applicant.findUnique({ where: { id: cookieApplicantId }, select: { id: true } })
          : null;
        if (!registered || !(await applicantHasAgreed(registered.id, tx))) return null;
        applicantId = registered.id;
      }
      return createApplications(tx, applicantId, link.id, selectedCases, parsed.data.notes, receivedAt);
    });
    if (!done) {
      return reply.code(401).send({ error: NOT_REGISTERED });
    }
    const { applicant, planned } = done;

    // この端末の目印を付け直す(有効期限を延ばす)
    setApplicantCookie(reply, applicant.id);

    const items = planned.map((p) => ({
      inquiryNumber: formatInquiryNumber(applicant.inquiryNumber, p.seq),
      title: applicantFacingTitle(p.case),
      companyName: p.case.company.name,
      alreadyApplied: p.alreadyApplied,
    }));
    const newCount = items.filter((it) => !it.alreadyApplied).length;

    // 新しい申込があったときだけ、申込者に受付完了メール、紹介者に(毎日開くサービスではないため)LINEで
    // 申込発生を知らせる。すべて申込済みの案件だった場合は画面の表示のみ。
    // どちらも失敗しても申込自体は保存済みなので、例外は投げずに結果だけ受け取る。
    const [confirmationEmailSent] =
      newCount > 0
        ? await Promise.all([
            (() => {
              const email = buildApplicationReceivedEmail({ fullName: applicant.fullName, items, receivedAt });
              return sendEmail(applicant.email, email.subject, email.text);
            })(),
            notifyReferrer(link.referrerId, `紹介した方からお申し込みがありました(${newCount}件)。`),
          ])
        : [false];

    const result: ApplyResultDto = {
      applicationCount: newCount,
      confirmationEmailSent,
      applications: items.map((it) => ({
        inquiryNumber: it.inquiryNumber,
        caseTitle: it.title,
        companyName: it.companyName,
        alreadyApplied: it.alreadyApplied,
      })),
    };
    return result;
  });
}
