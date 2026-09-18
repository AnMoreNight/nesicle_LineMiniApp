import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@nesicle/db";
import { ADMIN_COOKIE, REFERRER_COOKIE, verifyAdminToken, verifyReferrerToken } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    referrerUserId: string;
    adminId: string;
  }
}

export async function requireReferrer(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[REFERRER_COOKIE];
  if (!token) {
    return reply.code(401).send({ error: "ログインが必要です。" });
  }
  try {
    const payload = verifyReferrerToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return reply.code(401).send({ error: "ログインが必要です。" });
    }
    request.referrerUserId = user.id;
  } catch {
    return reply.code(401).send({ error: "ログインが必要です。" });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[ADMIN_COOKIE];
  if (!token) {
    return reply.code(401).send({ error: "管理者ログインが必要です。" });
  }
  try {
    const payload = verifyAdminToken(token);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.adminId } });
    if (!admin) {
      return reply.code(401).send({ error: "管理者ログインが必要です。" });
    }
    request.adminId = admin.id;
  } catch {
    return reply.code(401).send({ error: "管理者ログインが必要です。" });
  }
}
