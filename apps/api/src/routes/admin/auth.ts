import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@nesicle/db";
import { requireAdmin } from "../../lib/auth.js";
import { ADMIN_COOKIE, cookieOptions, signAdminToken } from "../../lib/jwt.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Admin console is normally accessed same-site (plain localhost), unlike the LIFF app.
const COOKIE_OPTIONS = cookieOptions(60 * 60 * 12, false);

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
}
