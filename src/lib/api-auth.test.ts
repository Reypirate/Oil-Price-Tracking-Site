import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { ApiAuthError, requireSupabaseUserId } from "./api-auth";
import { getSupabaseAdmin } from "./supabase";

describe("requireSupabaseUserId", () => {
  const getUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      auth: { getUser },
    } as never);
  });

  it("throws unauthorized when bearer token is missing", async () => {
    await expect(requireSupabaseUserId(new Request("http://localhost/api/alerts"))).rejects.toThrow(
      ApiAuthError,
    );
  });

  it("throws unauthorized when token is invalid", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid token" },
    });

    await expect(
      requireSupabaseUserId(
        new Request("http://localhost/api/alerts", {
          headers: { authorization: "Bearer invalid-token" },
        }),
      ),
    ).rejects.toThrow("Unauthorized. Invalid or expired Supabase session.");
  });

  it("returns user id when token is valid", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    await expect(
      requireSupabaseUserId(
        new Request("http://localhost/api/alerts", {
          headers: { authorization: "Bearer valid-token" },
        }),
      ),
    ).resolves.toBe("user-123");
  });
});
