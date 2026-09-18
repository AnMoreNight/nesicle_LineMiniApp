import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireReferrer } from "../lib/auth.js";

const profileSchema = z.object({
  fullName: z.string().min(1).max(60),
  phone: z.string().min(1).max(30),
  email: z.string().email(),
  postalCode: z.string().max(10).default(""),
  address: z.string().min(1).max(200),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(1).max(60),
  branchName: z.string().min(1).max(60),
  accountType: z.enum(["ORDINARY", "CHECKING"]),
  accountNumber: z.string().min(1).max(20),
  accountHolder: z.string().min(1).max(60),
});

export default async function profileRoutes(app: FastifyInstance) {
  app.get("/api/me/profile", { preHandler: requireReferrer }, async (request) => {
    const profile = await prisma.referrerProfile.upsert({
      where: { userId: request.referrerUserId },
      update: {},
      create: { userId: request.referrerUserId },
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.referrerUserId } });
    return {
      displayName: user.displayName,
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
      postalCode: profile.postalCode,
      address: profile.address,
    };
  });

  app.put("/api/me/profile", { preHandler: requireReferrer }, async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    await prisma.referrerProfile.upsert({
      where: { userId: request.referrerUserId },
      update: parsed.data,
      create: { userId: request.referrerUserId, ...parsed.data },
    });
    return { ok: true };
  });

  app.get("/api/me/bank-account", { preHandler: requireReferrer }, async (request, reply) => {
    const profile = await prisma.referrerProfile.findUnique({
      where: { userId: request.referrerUserId },
      include: { bankAccount: true },
    });
    if (!profile?.bankAccount) {
      return reply.code(404).send({ error: "振込先口座が未登録です。" });
    }
    return profile.bankAccount;
  });

  app.put("/api/me/bank-account", { preHandler: requireReferrer }, async (request, reply) => {
    const parsed = bankAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const profile = await prisma.referrerProfile.upsert({
      where: { userId: request.referrerUserId },
      update: {},
      create: { userId: request.referrerUserId },
    });
    await prisma.bankAccount.upsert({
      where: { referrerProfileId: profile.id },
      update: parsed.data,
      create: { referrerProfileId: profile.id, ...parsed.data },
    });
    return { ok: true };
  });
}
