import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireReferrer } from "../lib/auth.js";
import { serializeCaseSummary } from "../lib/serialize.js";

const addSchema = z.object({
  caseId: z.string().min(1),
});

async function loadSelection(userId: string) {
  const rows = await prisma.referralSelection.findMany({
    where: { userId },
    include: { case: { include: { company: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => serializeCaseSummary(row.case));
}

export default async function selectionRoutes(app: FastifyInstance) {
  app.get("/api/me/selection", { preHandler: requireReferrer }, async (request) => {
    return loadSelection(request.referrerUserId);
  });

  app.post("/api/me/selection", { preHandler: requireReferrer }, async (request, reply) => {
    const parsed = addSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "入力内容を確認してください。" });
    }
    const targetCase = await prisma.case.findFirst({ where: { id: parsed.data.caseId, status: "PUBLISHED" } });
    if (!targetCase) {
      return reply.code(400).send({ error: "選択された案件が見つかりません。" });
    }
    await prisma.referralSelection.upsert({
      where: { userId_caseId: { userId: request.referrerUserId, caseId: parsed.data.caseId } },
      update: {},
      create: { userId: request.referrerUserId, caseId: parsed.data.caseId },
    });
    return loadSelection(request.referrerUserId);
  });

  app.delete("/api/me/selection/:caseId", { preHandler: requireReferrer }, async (request) => {
    const { caseId } = request.params as { caseId: string };
    await prisma.referralSelection.deleteMany({ where: { userId: request.referrerUserId, caseId } });
    return loadSelection(request.referrerUserId);
  });

  app.delete("/api/me/selection", { preHandler: requireReferrer }, async (request) => {
    await prisma.referralSelection.deleteMany({ where: { userId: request.referrerUserId } });
    return { ok: true };
  });
}
