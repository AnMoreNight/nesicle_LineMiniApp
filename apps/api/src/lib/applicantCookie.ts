import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";
import { cookieOptions } from "./jwt.js";

// 申込が完了した端末に付ける「この端末で以前に申し込んだ人」の目印。中身は署名つきの応募者IDだけで、
// 個人情報は入れない(DBの変更も不要)。次回の申込で最初に照合し、申込フォームの入力補完にも使う。
export const APPLICANT_COOKIE = "optas_applicant";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1年

// 紹介者ログインのトークンと取り違えられないよう、署名の鍵を分ける
const secret = () => `${env.jwtSecret}:applicant`;

export function setApplicantCookie(reply: FastifyReply, applicantId: string) {
  const token = jwt.sign({ applicantId }, secret(), { expiresIn: MAX_AGE_SECONDS });
  reply.setCookie(APPLICANT_COOKIE, token, cookieOptions(MAX_AGE_SECONDS, env.crossSiteCookies));
}

/** 有効な目印があればその応募者ID。なし・改ざん・期限切れなら null */
export function readApplicantCookie(request: FastifyRequest): string | null {
  const token = request.cookies[APPLICANT_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as { applicantId?: unknown };
    return typeof payload.applicantId === "string" ? payload.applicantId : null;
  } catch {
    return null;
  }
}

export function clearApplicantCookie(reply: FastifyReply) {
  reply.clearCookie(APPLICANT_COOKIE, { path: "/" });
}
