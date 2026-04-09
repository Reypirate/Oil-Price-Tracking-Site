import { randomUUID } from "node:crypto";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard";
import { logger } from "@/lib/logger";
import { limitDashboardRequest } from "@/lib/ratelimit";

type RateLimitResult = {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
};

type DashboardRouteDeps = {
  createRequestId: () => string;
  getNow: () => number;
  getSnapshot: () => Promise<DashboardSnapshot>;
  limitRequest: (clientIp: string) => Promise<RateLimitResult>;
  logError: (context: object, message: string) => void;
};

type DashboardRouteResult = {
  body: DashboardSnapshot | { error: string };
  headers: Record<string, string>;
  status: number;
};

const defaultDeps: DashboardRouteDeps = {
  createRequestId: randomUUID,
  getNow: Date.now,
  getSnapshot: buildDashboardSnapshot,
  limitRequest: limitDashboardRequest,
  logError: (context, message) => logger.error(context, message),
};

const TOO_MANY_REQUESTS_ERROR = "Too Many Requests";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function handleDashboardRequest(
  request: Request,
  overrides: Partial<DashboardRouteDeps> = {},
): Promise<DashboardRouteResult> {
  const deps: DashboardRouteDeps = {
    ...defaultDeps,
    ...overrides,
  };
  const requestId = deps.createRequestId();

  try {
    const rateLimit = await deps.limitRequest(getClientIp(request));
    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(rateLimit.limit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.reset),
      "X-Request-Id": requestId,
    };

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(0, Math.ceil((rateLimit.reset - deps.getNow()) / 1000));
      return {
        body: { error: TOO_MANY_REQUESTS_ERROR },
        status: 429,
        headers: {
          ...rateLimitHeaders,
          "Retry-After": String(retryAfterSeconds),
        },
      };
    }

    const snapshot = await deps.getSnapshot();
    return {
      body: snapshot,
      status: 200,
      headers: rateLimitHeaders,
    };
  } catch (error: unknown) {
    deps.logError({ err: error, requestId }, "Dashboard route failed");
    return {
      body: { error: "Failed to fetch dashboard data" },
      status: 500,
      headers: { "X-Request-Id": requestId },
    };
  }
}
