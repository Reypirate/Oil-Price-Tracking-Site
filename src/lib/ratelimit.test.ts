import { describe, expect, it, vi } from "vitest";
import {
  buildDashboardRateLimitKey,
  type DashboardRateLimiter,
  getDashboardRateLimiter,
  limitDashboardRequest,
} from "./ratelimit";

describe("buildDashboardRateLimitKey", () => {
  it("normalizes keys using trimmed client IP", () => {
    expect(buildDashboardRateLimitKey(" 10.0.0.1 ")).toBe("dashboard:10.0.0.1");
  });

  it("falls back to unknown when client IP is empty", () => {
    expect(buildDashboardRateLimitKey("   ")).toBe("dashboard:unknown");
  });
});

describe("limitDashboardRequest", () => {
  it("applies the normalized IP key to the limiter", async () => {
    const limit = vi.fn().mockResolvedValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Date.now() + 60_000,
    });
    const limiter: DashboardRateLimiter = { limit };

    const result = await limitDashboardRequest(" 192.168.1.20 ", limiter);

    expect(limit).toHaveBeenCalledWith("dashboard:192.168.1.20");
    expect(result.success).toBe(true);
  });

  it("returns blocked status when limiter reports over-limit", async () => {
    const limit = vi.fn().mockResolvedValue({
      success: false,
      limit: 120,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    const limiter: DashboardRateLimiter = { limit };

    const result = await limitDashboardRequest("127.0.0.1", limiter);
    expect(result.success).toBe(false);
  });
});

describe("getDashboardRateLimiter", () => {
  it("falls back to permissive limiter when Upstash config is missing", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const limiter = getDashboardRateLimiter();
    const result = await limiter.limit("dashboard:test");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
  });
});
