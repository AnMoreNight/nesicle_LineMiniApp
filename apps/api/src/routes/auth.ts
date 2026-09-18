import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { env } from "../env.js";
import { requireReferrer } from "../lib/auth.js";
import { REFERRER_COOKIE, cookieOptions, signReferrerToken } from "../lib/jwt.js";
import { verifyLineIdToken } from "../lib/liffVerify.js";

const COOKIE_OPTIONS = cookieOptions(60 * 60 * 24 * 30, env.crossSiteCookies);

async function upsertReferrerUser(lineUserId: string, displayName: string, pictureUrl?: string | null) {
  const user = await prisma.user.upsert({
    where: { lineUserId },
    update: { displayName, pictureUrl: pictureUrl ?? undefined },
    create: { lineUserId, displayName, pictureUrl: pictureUrl ?? null },
  });
  await prisma.referrerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });
  return user;
}

const devLoginSchema = z.object({
  lineUserId: z.string().min(1).optional(),
  displayName: z.string().min(1).max(60),
});

const liffLoginSchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().min(1).max(60).optional(),
  pictureUrl: z.string().url().optional(),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/dev-login", async (request, reply) => {
    if (!env.allowDevLogin) {
      return reply.code(403).send({ error: "開発用ログインは無効化されています。" });
    }
    const parsed = devLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "入力内容を確認してください。", issues: parsed.error.issues });
    }
    const lineUserId = parsed.data.lineUserId ?? `dev-${randomUUID()}`;
    const user = await upsertReferrerUser(lineUserId, parsed.data.displayName);
    const token = signReferrerToken({ userId: user.id });
    reply.setCookie(REFERRER_COOKIE, token, COOKIE_OPTIONS);
    return { id: user.id, lineUserId: user.lineUserId, displayName: user.displayName };
  });

  app.post("/api/auth/liff-login", async (request, reply) => {
    const parsed = liffLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "入力内容を確認してください。", issues: parsed.error.issues });
    }
    if (!env.lineLoginChannelId) {
      return reply.code(503).send({ error: "LINEログインが設定されていません。" });
    }
    try {
      const profile = await verifyLineIdToken(parsed.data.idToken, env.lineLoginChannelId);
      const user = await upsertReferrerUser(
        profile.sub,
        parsed.data.displayName ?? profile.name ?? "LINEユーザー",
        parsed.data.pictureUrl ?? profile.picture,
      );
      const token = signReferrerToken({ userId: user.id });
      reply.setCookie(REFERRER_COOKIE, token, COOKIE_OPTIONS);
      return { id: user.id, lineUserId: user.lineUserId, displayName: user.displayName };
    } catch (err) {
      request.log.error(err);
      return reply.code(401).send({ error: "LINEログインの検証に失敗しました。" });
    }
  });

  app.post("/api/auth/logout", async (_request, reply) => {
    reply.clearCookie(REFERRER_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/api/auth/me", { preHandler: requireReferrer }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.referrerUserId },
      include: { referrerProfile: { include: { bankAccount: true } } },
    });
    return {
      id: user.id,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      hasCompleteProfile: Boolean(user.referrerProfile?.fullName && user.referrerProfile?.phone),
      hasBankAccount: Boolean(user.referrerProfile?.bankAccount),
    };
  });
}
