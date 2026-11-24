import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireReferrer } from "../lib/auth.js";
import { TERMS_VERSION } from "../lib/consent.js";

// 版は画面から受け取らず、常にサーバーの現在の版(TERMS_VERSION)で記録する。
// 規約を改定したときは TERMS_VERSION を上げるだけで、全員に再同意を求められる。
const consentSchema = z.object({
  documentType: z.enum(["TERMS", "PRIVACY"]),
});

export default async function consentRoutes(app: FastifyInstance) {
  app.get("/api/me/consent", { preHandler: requireReferrer }, async (request) => {
    const record = await prisma.consentRecord.findFirst({
      where: { subjectType: "REFERRER", subjectId: request.referrerUserId, documentType: "TERMS" },
      orderBy: { agreedAt: "desc" },
    });
    // 同意済み = 現在の版に同意している(古い版への同意だけなら、改めて同意が必要)
    return {
      agreed: record?.version === TERMS_VERSION,
      currentVersion: TERMS_VERSION,
      agreedVersion: record?.version ?? null,
    };
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
        version: TERMS_VERSION,
      },
    });
    return { ok: true };
  });
}
