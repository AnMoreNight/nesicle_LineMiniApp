import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { formatInquiryNumber, type ApplyResultDto, type ReferralLandingDto } from "@nesicle/shared";
import { serializeLandingCase } from "../lib/serialize.js";
import { notifyReferrer } from "../lib/lineNotify.js";
import { sendEmail } from "../lib/mailer.js";
import { buildApplicationReceivedEmail } from "../lib/applicationEmail.js";

const applySchema = z.object({
  fullName: z.string().min(1).max(60),
  birthDate: z.string().min(1),
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
    const bundledCaseIds = new Set(link.cases.map((rc) => rc.caseId));
    const selectedCaseIds = parsed.data.caseIds.filter((id) => bundledCaseIds.has(id));
    if (selectedCaseIds.length === 0) {
      return reply.code(400).send({ error: "この紹介URLに含まれる案件を選択してください。" });
    }

    const birthDate = new Date(parsed.data.birthDate);
    if (Number.isNaN(birthDate.getTime())) {
      return reply.code(400).send({ error: "生年月日の形式を確認してください。" });
    }

    const applicant = await prisma.applicant.create({
      data: {
        fullName: parsed.data.fullName,
        birthDate,
        postalCode: parsed.data.postalCode,
        address: parsed.data.address,
        phone: parsed.data.phone,
        email: parsed.data.email,
        notes: parsed.data.notes,
      },
    });

    await prisma.consentRecord.create({
      data: {
        subjectType: "APPLICANT",
        subjectId: applicant.id,
        documentType: "TERMS",
        version: "1.0",
      },
    });

    await prisma.application.createMany({
      data: selectedCaseIds.map((caseId) => ({
        applicantId: applicant.id,
        caseId,
        referralLinkId: link.id,
      })),
    });

    const inquiryNumber = formatInquiryNumber(applicant.inquiryNumber);
    const email = buildApplicationReceivedEmail({
      fullName: applicant.fullName,
      inquiryNumber,
      cases: link.cases
        .filter((rc) => selectedCaseIds.includes(rc.caseId))
        .map((rc) => ({ title: rc.case.title, companyName: rc.case.company.name })),
      receivedAt: applicant.createdAt,
    });

    // 申込者には受付完了メール、紹介者には(毎日開くサービスではないため)LINEで申込発生を知らせる。
    // どちらも失敗しても申込自体は保存済みなので、例外は投げずに結果だけ受け取る。
    const [confirmationEmailSent] = await Promise.all([
      sendEmail(applicant.email, email.subject, email.text),
      notifyReferrer(link.referrerId, `紹介した方からお申し込みがありました(${selectedCaseIds.length}件)。`),
    ]);

    const result: ApplyResultDto = {
      inquiryNumber,
      applicationCount: selectedCaseIds.length,
      confirmationEmailSent,
    };
    return result;
  });
}
