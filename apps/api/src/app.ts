import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./env.js";
import authRoutes from "./routes/auth.js";
import casesRoutes from "./routes/cases.js";
import referralLinksRoutes from "./routes/referralLinks.js";
import selectionRoutes from "./routes/selection.js";
import applicationsRoutes from "./routes/applications.js";
import rewardsRoutes from "./routes/rewards.js";
import profileRoutes from "./routes/profile.js";
import consentRoutes from "./routes/consent.js";
import publicRoutes from "./routes/public.js";
import adminAuthRoutes from "./routes/admin/auth.js";
import adminCompaniesRoutes from "./routes/admin/companies.js";
import adminCasesRoutes from "./routes/admin/cases.js";
import adminReferrersRoutes from "./routes/admin/referrers.js";
import adminApplicantsRoutes from "./routes/admin/applicants.js";
import adminApplicationsRoutes from "./routes/admin/applications.js";
import adminStatsRoutes from "./routes/admin/stats.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
  });
  await app.register(cookie);

  app.get("/health", async () => ({ ok: true }));

  await app.register(authRoutes);
  await app.register(casesRoutes);
  await app.register(referralLinksRoutes);
  await app.register(selectionRoutes);
  await app.register(applicationsRoutes);
  await app.register(rewardsRoutes);
  await app.register(profileRoutes);
  await app.register(consentRoutes);
  await app.register(publicRoutes);

  await app.register(adminAuthRoutes);
  await app.register(adminCompaniesRoutes);
  await app.register(adminCasesRoutes);
  await app.register(adminReferrersRoutes);
  await app.register(adminApplicantsRoutes);
  await app.register(adminApplicationsRoutes);
  await app.register(adminStatsRoutes);

  return app;
}
