import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { env } from "../../env.js";
import { requireAdmin } from "../../lib/auth.js";
import { ADMIN_COOKIE, cookieOptions, signAdminToken } from "../../lib/jwt.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください。"),
});

// Same cross-site flag the referrer/LIFF cookie uses — the admin console now runs as its own
// deployed web app (Vercel) talking to the API on a different domain (Render), just like LIFF,
// so it needs the same SameSite=None+Secure handling. Locally both stay on plain localhost,
// where COOKIE_CROSS_SITE is unset/false and Lax cookies work fine.
const COOKIE_OPTIONS = cookieOptions(60 * 60 * 12, env.crossSiteCookies);

export default async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/api/admin/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "メールアドレスとパスワードを入力してください。" });
    }
    const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
      return reply.code(401).send({ error: "メールアドレスまたはパスワードが正しくありません。" });
    }
    const token = signAdminToken({ adminId: admin.id });
    reply.setCookie(ADMIN_COOKIE, token, COOKIE_OPTIONS);
    return { id: admin.id, email: admin.email, displayName: admin.displayName };
  });

  app.post("/api/admin/auth/logout", async (_request, reply) => {
    reply.clearCookie(ADMIN_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/api/admin/auth/me", { preHandler: requireAdmin }, async (request) => {
    const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: request.adminId } });
    return { id: admin.id, email: admin.email, displayName: admin.displayName };
  });

  app.put("/api/admin/auth/password", { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = changePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。" });
    }
    const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: request.adminId } });
    if (!(await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash))) {
      return reply.code(401).send({ error: "現在のパスワードが正しくありません。" });
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } });
    return { ok: true };
  });
}
