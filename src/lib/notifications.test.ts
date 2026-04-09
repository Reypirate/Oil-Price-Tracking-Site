import { afterEach, describe, expect, it, vi } from "vitest";
import { getResolvedMailMode } from "./notifications";

describe("getResolvedMailMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns explicit override when provided", () => {
    vi.stubEnv("MAIL_MODE", "maildev");
    expect(getResolvedMailMode("resend")).toBe("resend");
  });

  it("falls back to MAIL_MODE=maildev", () => {
    vi.stubEnv("MAIL_MODE", "maildev");
    expect(getResolvedMailMode()).toBe("maildev");
  });

  it("falls back to resend when MAIL_MODE is missing", () => {
    expect(getResolvedMailMode()).toBe("resend");
  });
});
