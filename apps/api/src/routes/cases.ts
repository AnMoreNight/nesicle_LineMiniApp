import type { FastifyInstance } from "fastify";
import { prisma } from "@nesicle/db";
import { requireReferrer } from "../lib/auth.js";
import { serializeCaseDetail, serializeCaseSummary } from "../lib/serialize.js";

export default async function casesRoutes(app: FastifyInstance) {
  app.get("/api/cases", { preHandler: requireReferrer }, async () => {
    const cases = await prisma.case.findMany({
      where: { status: "PUBLISHED" },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
    return cases.map(serializeCaseSummary);
  });

  app.get("/api/cases/:id", { preHandler: requireReferrer }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const c = await prisma.case.findFirst({
      where: { id, status: "PUBLISHED" },
      include: { company: true },
    });
    if (!c) {
      return reply.code(404).send({ error: "案件が見つかりません。" });
    }
    return serializeCaseDetail(c);
  });
}
