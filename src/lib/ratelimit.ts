import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { DASHBOARD_RATE_LIMIT_MAX_REQUESTS, DASHBOARD_RATE_LIMIT_WINDOW } from "@/lib/config";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type RateLimitResult = {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
};

export type DashboardRateLimiter = {
  limit(identifier: string): Promise<RateLimitResult>;
};

let dashboardRateLimiter: DashboardRateLimiter | undefined;
let didWarnRateLimitBypass = false;

const permissiveRateLimiter: DashboardRateLimiter = {
  limit: async () => ({
    success: true,
    limit: Number.MAX_SAFE_INTEGER,
    remaining: Number.MAX_SAFE_INTEGER,
    reset: Date.now() + 60_000,
  }),
};

export function buildDashboardRateLimitKey(clientIp: string): string {
  const normalizedIp = clientIp.trim();
  return `dashboard:${normalizedIp || "unknown"}`;
}

export function getDashboardRateLimiter(): DashboardRateLimiter {
  if (!dashboardRateLimiter) {
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      if (!didWarnRateLimitBypass) {
        logger.warn(
          "Dashboard rate limiting disabled: missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN",
        );
        didWarnRateLimitBypass = true;
      }
      dashboardRateLimiter = permissiveRateLimiter;
      return dashboardRateLimiter;
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    dashboardRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        DASHBOARD_RATE_LIMIT_MAX_REQUESTS,
        DASHBOARD_RATE_LIMIT_WINDOW,
      ),
      prefix: "ratelimit:dashboard",
    });
  }

  return dashboardRateLimiter;
}

export async function limitDashboardRequest(
  clientIp: string,
  limiter: DashboardRateLimiter = getDashboardRateLimiter(),
): Promise<RateLimitResult> {
  return limiter.limit(buildDashboardRateLimitKey(clientIp));
}
