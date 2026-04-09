import { beforeEach, describe, expect, it, vi } from "vitest";
import { processAlerts } from "./alerts";
import * as notificationsModule from "./notifications";
import type { OilPriceData } from "./oil-api";
import * as supabaseModule from "./supabase";

describe("processAlerts", () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    rpcMock.mockReset();
    vi.spyOn(notificationsModule, "sendPriceAlertEmail").mockResolvedValue(true);
    vi.spyOn(supabaseModule, "getSupabaseAdmin").mockReturnValue({
      rpc: rpcMock,
    } as never);
  });

  it("maps rpc-triggered alerts into response contract and sends emails", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "a1",
          user_id: "u1",
          asset_code: "WTI_USD",
          condition: "above",
          threshold_price: 79.5,
          email: "first@example.com",
        },
        {
          id: "b2",
          user_id: "u2",
          asset_code: "WTI_USD",
          condition: "below",
          threshold_price: 81.5,
          email: "second@example.com",
        },
      ],
      error: null,
    });

    const priceData: OilPriceData = {
      code: "WTI",
      currency: "USD",
      price: 80,
      updated_at: "2026-04-09T00:00:00Z",
      created_at: "2026-04-09T00:00:00Z",
    };

    const result = await processAlerts(priceData);

    expect(rpcMock).toHaveBeenCalledWith("trigger_matching_alerts", {
      p_asset_code: "WTI_USD",
      p_price: 80,
    });

    expect(result).toEqual({
      assetCode: "WTI_USD",
      matched: 2,
      updated: 2,
      notified: 2,
      triggeredIds: ["a1", "b2"],
    });
    expect(notificationsModule.sendPriceAlertEmail).toHaveBeenCalledTimes(2);
  });

  it("returns zero counts when rpc reports no matches", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    const result = await processAlerts({
      code: "WTI_USD",
      currency: "USD",
      price: 70,
      updated_at: "2026-04-09T00:00:00Z",
      created_at: "2026-04-09T00:00:00Z",
    });

    expect(result).toEqual({
      assetCode: "WTI_USD",
      matched: 0,
      updated: 0,
      notified: 0,
      triggeredIds: [],
    });
  });

  it("skips notifications when triggered alert has no recipient email", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "a1",
          user_id: "u1",
          asset_code: "WTI_USD",
          condition: "above",
          threshold_price: 80,
          email: null,
        },
      ],
      error: null,
    });

    const result = await processAlerts({
      code: "WTI_USD",
      currency: "USD",
      price: 85,
      updated_at: "2026-04-09T00:00:00Z",
      created_at: "2026-04-09T00:00:00Z",
    });

    expect(result).toEqual({
      assetCode: "WTI_USD",
      matched: 1,
      updated: 1,
      notified: 0,
      triggeredIds: ["a1"],
    });
    expect(notificationsModule.sendPriceAlertEmail).not.toHaveBeenCalled();
  });

  it("surfaces rpc failures as persistence errors", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    await expect(
      processAlerts({
        code: "WTI_USD",
        currency: "USD",
        price: 90,
        updated_at: "2026-04-09T00:00:00Z",
        created_at: "2026-04-09T00:00:00Z",
      }),
    ).rejects.toThrow("Persistence Error: boom");
  });
});
