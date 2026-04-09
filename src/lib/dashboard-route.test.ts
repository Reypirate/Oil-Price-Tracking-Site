import { describe, expect, it, vi } from "vitest";
import { handleDashboardRequest } from "./dashboard-route";

describe("handleDashboardRequest", () => {
  it("returns 429 when rate limiter blocks request", async () => {
    const result = await handleDashboardRequest(new Request("http://localhost/api/dashboard"), {
      createRequestId: () => "req-blocked",
      getNow: () => 1_000,
      limitRequest: async () => ({
        success: false,
        limit: 120,
        remaining: 0,
        reset: 31_000,
      }),
      getSnapshot: vi.fn(),
      logError: vi.fn(),
    });

    expect(result.status).toBe(429);
    expect(result.body).toEqual({ error: "Too Many Requests" });
    expect(result.headers["Retry-After"]).toBe("30");
    expect(result.headers["X-Request-Id"]).toBe("req-blocked");
  });

  it("returns snapshot payload with rate-limit headers when request is allowed", async () => {
    const snapshot = {
      price: { usd: 80, php: 4520, change24h: 1.1, changeAmount: 0.8 },
      diesel: { usdPerGallon: 4, phpPerLiter: 50, change24h: -0.5 },
      intelligence: {
        forecast: 81.2,
        trend: "BULLISH" as const,
        mood: "OPTIMISTIC" as const,
        sentimentScore: 2,
        keywords: ["opec"],
      },
      history: [{ date: "Apr 01", price: 79 }],
    };

    const result = await handleDashboardRequest(new Request("http://localhost/api/dashboard"), {
      createRequestId: () => "req-ok",
      limitRequest: async () => ({
        success: true,
        limit: 120,
        remaining: 118,
        reset: 40_000,
      }),
      getSnapshot: async () => snapshot,
      logError: vi.fn(),
      getNow: () => Date.now(),
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual(snapshot);
    expect(result.headers["X-RateLimit-Limit"]).toBe("120");
    expect(result.headers["X-RateLimit-Remaining"]).toBe("118");
    expect(result.headers["X-Request-Id"]).toBe("req-ok");
  });

  it("returns 500 and logs error when snapshot creation fails", async () => {
    const logError = vi.fn();
    const result = await handleDashboardRequest(new Request("http://localhost/api/dashboard"), {
      createRequestId: () => "req-err",
      limitRequest: async () => ({
        success: true,
        limit: 120,
        remaining: 119,
        reset: 40_000,
      }),
      getSnapshot: async () => {
        throw new Error("snapshot failure");
      },
      logError,
      getNow: () => Date.now(),
    });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: "Failed to fetch dashboard data" });
    expect(logError).toHaveBeenCalled();
  });
});
