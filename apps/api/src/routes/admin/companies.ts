import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";

const companySchema = z.object({
  name: z.string().min(1).max(100),
  contactName: z.string().max(60).default(""),
  contactEmail: z.string().max(120).default(""),
  contactPhone: z.string().max(30).default(""),
  notes: z.string().max(1000).default(""),
});

export default async function adminCompaniesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/api/admin/companies", async () => {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { cases: true } } },
      orderBy: { createdAt: "desc" },
    });
    return companies.map((c) => ({ ...c, caseCount: c._count.cases }));
  });

  app.get("/api/admin/companies/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const company = await prisma.company.findUnique({ where: { id }, include: { cases: true } });
    if (!company) return reply.code(404).send({ error: "掲載企業が見つかりません。" });
    return company;
  });

  app.post("/api/admin/companies", async (request, reply) => {
    const parsed = companySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const company = await prisma.company.create({ data: parsed.data });
    return company;
  });

  app.put("/api/admin/companies/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = companySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const company = await prisma.company.update({ where: { id }, data: parsed.data });
    return company;
  });
}
