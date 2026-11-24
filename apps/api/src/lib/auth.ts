import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@nesicle/db";
import { ADMIN_COOKIE, REFERRER_COOKIE, verifyAdminToken, verifyReferrerToken } from "./jwt.js";
import { hasAgreedToTerms } from "./consent.js";

declare module "fastify" {
  interface FastifyRequest {
    referrerUserId: string;
    adminId: string;
  }
}

/** ログイン中の紹介者のID(ログインのCookieが無い・無効・該当ユーザーなしなら null) */
async function loggedInReferrerId(request: FastifyRequest): Promise<string | null> {
  const token = request.cookies[REFERRER_COOKIE];
  if (!token) return null;
  try {
    const payload = verifyReferrerToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true } });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** ログイン済みの紹介者だけを通す(同意前でもよいもの: /api/auth/me、/api/me/consent) */
export async function requireReferrer(request: FastifyRequest, reply: FastifyReply) {
  const userId = await loggedInReferrerId(request);
  if (!userId) {
    return reply.code(401).send({ error: "ログインが必要です。" });
  }
  request.referrerUserId = userId;
}

/**
 * ログイン済みで、現在の版の利用規約・プライバシーポリシーに同意済みの紹介者だけを通す。
 * 同意前に使えるのはログイン関連(/api/auth/*)と同意(/api/me/consent)だけにし、
 * 案件・報酬の情報や紹介URLの発行、個人情報の登録はサーバー側でも同意を必須にする。
 */
export async function requireAgreedReferrer(request: FastifyRequest, reply: FastifyReply) {
  const userId = await loggedInReferrerId(request);
  if (!userId) {
    return reply.code(401).send({ error: "ログインが必要です。" });
  }
  if (!(await hasAgreedToTerms(userId))) {
    return reply
      .code(403)
      .send({ error: "ご利用には、利用規約およびプライバシーポリシーへの同意が必要です。", code: "TERMS_NOT_AGREED" });
  }
  request.referrerUserId = userId;
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
