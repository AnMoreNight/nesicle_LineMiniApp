import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireReferrer } from "../lib/auth.js";

const TERMS_VERSION = "1.0";

const consentSchema = z.object({
  documentType: z.enum(["TERMS", "PRIVACY"]),
  version: z.string().min(1).default(TERMS_VERSION),
});

export default async function consentRoutes(app: FastifyInstance) {
  app.get("/api/me/consent", { preHandler: requireReferrer }, async (request) => {
    const record = await prisma.consentRecord.findFirst({
      where: { subjectType: "REFERRER", subjectId: request.referrerUserId, documentType: "TERMS" },
      orderBy: { agreedAt: "desc" },
    });
    return { agreed: Boolean(record), currentVersion: TERMS_VERSION, agreedVersion: record?.version ?? null };
  });

  app.post("/api/me/consent", { preHandler: requireReferrer }, async (request, reply) => {
    const parsed = consentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "入力内容を確認してください。" });
    }
    await prisma.consentRecord.create({
      data: {
        subjectType: "REFERRER",
        subjectId: request.referrerUserId,
        documentType: parsed.data.documentType,
        version: parsed.data.version,
      },
    });
    return { ok: true };
  });
}
