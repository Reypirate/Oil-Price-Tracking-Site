import { describe, expect, it, vi } from "vitest";
import { env } from "./env";

describe("Environment Service (Lazy-Init)", () => {
  // We stub these before tests run to ensure the proxy can resolve them
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock-project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "mock-anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-role-key");
  vi.stubEnv("OIL_PRICE_API_KEY", "mock-oil-api-key");
  vi.stubEnv("CRON_SECRET", "mock-cron-secret");

  it("should be defined and accessible", () => {
    expect(env).toBeDefined();
  });

  it("should attempt to access properties via simple get", () => {
    // We expect the proxy to return values from process.env
    // even if validation partially fails in a test environment
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(typeof env.NEXT_PUBLIC_SUPABASE_URL).toBe("string");
  });

  it("should have the correct keys accessible", () => {
    const keys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "CRON_SECRET"];
    for (const key of keys) {
      expect(env[key as keyof typeof env]).toBeDefined();
    }
  });
});
