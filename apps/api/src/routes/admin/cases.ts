import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, Prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";

const caseSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(30),
  area: z.string().min(1).max(60),
  summary: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  eligibilityNotes: z.string().max(1000).default(""),
  ineligibleNotes: z.string().max(1000).default(""),
  rewardTimingNotes: z.string().max(1000).default(""),
  rewardLabel: z.string().min(1).max(60),
  rewardAmount: z.coerce.number().int().min(0),
});

export default async function adminCasesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/cases", async (request) => {
    const { status, category } = request.query as { status?: string; category?: string };
    const cases = await prisma.case.findMany({
      where: {
        status: status ? (status as "DRAFT" | "PUBLISHED" | "SUSPENDED") : undefined,
        category: category || undefined,
      },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
    return cases;
  });

  app.get("/api/admin/cases/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const c = await prisma.case.findUnique({ where: { id }, include: { company: true } });
    if (!c) return reply.code(404).send({ error: "案件が見つかりません。" });
    return c;
  });

  app.post("/api/admin/cases", async (request, reply) => {
    const parsed = caseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const c = await prisma.case.create({ data: { ...parsed.data, status: "DRAFT" } });
    return c;
  });

  app.put("/api/admin/cases/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = caseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const c = await prisma.case.update({ where: { id }, data: parsed.data });
    return c;
  });

  app.post("/api/admin/cases/:id/publish", async (request) => {
    const { id } = request.params as { id: string };
    return prisma.case.update({ where: { id }, data: { status: "PUBLISHED" } });
  });

  app.post("/api/admin/cases/:id/suspend", async (request) => {
    const { id } = request.params as { id: string };
    return prisma.case.update({ where: { id }, data: { status: "SUSPENDED" } });
  });

  app.delete("/api/admin/cases/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.case.delete({ where: { id } });
    } catch (err) {
      // FK violation — this case has referral links or applications tied to it already.
      // Deleting those too would destroy real referral/reward history, so refuse and point
      // the admin at "suspend" (soft-delete) instead of silently cascading.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        return reply
          .code(409)
          .send({ error: "この案件は紹介URLまたは申込に紐づいているため削除できません。代わりに「停止する」を使用してください。" });
      }
      throw err;
    }
    return { ok: true };
  });
}
