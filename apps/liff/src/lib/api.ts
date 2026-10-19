const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      // Only set when there's an actual body — Fastify's JSON parser rejects a request
      // labeled application/json with an empty body (logout, clear-selection, etc. send none).
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      // Bypasses ngrok's free-tier browser-warning interstitial when the API is tunneled
      // through ngrok during LIFF testing; ignored by a real (non-ngrok) API host.
      "ngrok-skip-browser-warning": "true",
      ...(init?.headers ?? {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // Fastify's own error bodies ({ statusCode, error: "Not Found", ... }) carry English HTTP
    // status text, not a message meant for users; only our routes' { error } is user-facing.
    const message =
      body && typeof body.statusCode === "number"
        ? describeServerError(res.status, body.message)
        : (body && body.error) || `リクエストに失敗しました (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

function describeServerError(status: number, detail?: string): string {
  if (status === 404 && detail?.startsWith("Route ")) {
    return "現在この機能はご利用いただけません。しばらくしてから再度お試しください。";
  }
  if (status >= 500) return "サーバーでエラーが発生しました。時間をおいて再度お試しください。";
  return `リクエストに失敗しました (${status})`;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
