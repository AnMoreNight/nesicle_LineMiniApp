import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
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
import { TERMS_VERSION, applicantHasAgreed } from "../lib/consent.js";

const WITH_APPLICATIONS = {
  applications: { select: { caseId: true, inquirySeq: true, progressStatus: true } },
} as const;

const jstDate = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const applySchema = z.object({
  fullName: z.string().min(1).max(60),
  postalCode: z.string().max(10).default(""),
  address: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  email: z.string().email(),
  notes: z.string().max(2000).default(""),
  caseIds: z.array(z.string().min(1)).min(1, "申込先を1件以上選択してください。"),
  agreedTerms: z.literal(true),
});

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

  // この端末で以前に申し込んだ方(目印のCookieがなければ null)。申込フォームの入力補完と、
  // 同意済みの規約・申し込み済みの案件をもう一度求めないために使う。
  app.get("/api/applicant/me", async (request) => {
    const id = readApplicantCookie(request);
    const a = id ? await prisma.applicant.findUnique({ where: { id }, include: WITH_APPLICATIONS }) : null;
    const applicant: ReturningApplicantDto | null = a
      ? {
          fullName: a.fullName,
          postalCode: a.postalCode,
          address: a.address,
          phone: a.phone,
          email: a.email,
          agreedTerms: await applicantHasAgreed(a.id),
          appliedCaseIds: [...new Set(a.applications.filter((x) => isActiveApplication(x.progressStatus)).map((x) => x.caseId))],
        }
      : null;
    return { applicant };
  });

  // 「別の方の情報で入力」: この端末の目印を消し、次回から入力補完しない
  app.delete("/api/applicant/me", async (_request, reply) => {
    clearApplicantCookie(reply);
    return { ok: true };
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

    const input = parsed.data;
    const emailKey = normalizeEmail(input.email);
    const phoneKey = normalizePhone(input.phone);
    const cookieApplicantId = readApplicantCookie(request);
    const receivedAt = new Date();

    const { applicant, planned } = await prisma.$transaction(async (tx) => {
      // 同じ人(メール+電話)からの同時送信で二重に登録されないよう、この人の処理だけ順番に行う
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`applicant:${emailKey}|${phoneKey}`}))`;

      // 以前に申し込んだ人かを判定する。
      // 1. まずこの端末の目印(Cookie)の応募者と照合する。メールか電話のどちらかが一致すれば同じ人
      //    (片方を変えた場合も同じ人として扱う)。両方違えば、同じ端末を使う別の人として扱う。
      const fromCookie = cookieApplicantId
        ? await tx.applicant.findUnique({ where: { id: cookieApplicantId }, include: WITH_APPLICATIONS })
        : null;
      const cookieMatch =
        fromCookie && (normalizeEmail(fromCookie.email) === emailKey || normalizePhone(fromCookie.phone) === phoneKey)
          ? fromCookie
          : null;
      // 2. 目印がない・一致しない場合は、メールアドレスと電話番号が両方一致する応募者(古い方を優先)
      const existing =
        cookieMatch ??
        (
          await tx.applicant.findMany({
            where: { email: { equals: emailKey, mode: "insensitive" } },
            orderBy: { createdAt: "asc" },
            include: WITH_APPLICATIONS,
          })
        ).find((a) => normalizePhone(a.phone) === phoneKey) ??
        null;

      // 同じ案件で対応中の申込があれば新しく作らない。番号は既存の続きから振る。
      const planned = planApplications(selectedCases, existing?.applications ?? []);
      const notes = input.notes.trim();
      const applicant = existing
        ? await tx.applicant.update({
            where: { id: existing.id },
            // 連絡先は最新の入力にそろえる(引っ越し・電話番号の変更等)。希望内容は前回分を残し、日付つきで追記する。
            data: {
              fullName: input.fullName,
              postalCode: input.postalCode,
              address: input.address,
              phone: input.phone,
              email: input.email,
              ...(notes
                ? { notes: [existing.notes, `【${jstDate.format(receivedAt)} のお申し込み】\n${notes}`].filter(Boolean).join("\n\n") }
                : {}),
            },
          })
        : await tx.applicant.create({
            data: {
              fullName: input.fullName,
              postalCode: input.postalCode,
              address: input.address,
              phone: input.phone,
              email: input.email,
              notes: input.notes,
            },
          });

      // 同意の記録(利用規約・プライバシーポリシー)。以前のお申し込みで同じ版に同意済みなら追加しない。
      const agreedBefore = await tx.consentRecord.findMany({
        where: { subjectType: "APPLICANT", subjectId: applicant.id, version: TERMS_VERSION },
        select: { documentType: true },
      });
      const missing = (["TERMS", "PRIVACY"] as const).filter((d) => !agreedBefore.some((r) => r.documentType === d));
      if (missing.length > 0) {
        await tx.consentRecord.createMany({
          data: missing.map((documentType) => ({
            subjectType: "APPLICANT" as const,
            subjectId: applicant.id,
            documentType,
            version: TERMS_VERSION,
          })),
        });
      }

      const toCreate = planned.filter((p) => !p.alreadyApplied);
      if (toCreate.length > 0) {
        await tx.application.createMany({
          data: toCreate.map((p) => ({
            applicantId: applicant.id,
            caseId: p.case.id,
            referralLinkId: link.id,
            inquirySeq: p.seq,
          })),
        });
      }
      return { applicant, planned };
    });

    // この端末に「申し込んだ人」の目印を付ける(次回の照合と入力補完に使う)
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
