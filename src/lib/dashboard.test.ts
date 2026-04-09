import { describe, expect, it, vi } from "vitest";
import { buildDashboardSnapshot } from "./dashboard";
import type { OilPriceData } from "./oil-api";

function makePriceData(price: number, percent = 0, amount = 0): OilPriceData {
  return {
    code: "WTI_USD",
    currency: "USD",
    price,
    changes: {
      "24h": {
        percent,
        amount,
      },
    },
  };
}

describe("buildDashboardSnapshot", () => {
  it("returns deterministic dashboard payload from injected dependencies", async () => {
    const fetchOilPrice = vi
      .fn<[string], Promise<OilPriceData>>()
      .mockImplementation(async (assetCode: string) => {
        if (assetCode === "WTI_USD") {
          return makePriceData(82.5, 1.2, 0.98);
        }
        return {
          ...makePriceData(4.2, -0.6, -0.03),
          code: "DIESEL_USD",
        };
      });

    const snapshot = await buildDashboardSnapshot({
      fetchOilPrice,
      history: [
        { date: "Apr 01", price: 80 },
        { date: "Apr 02", price: 81 },
      ],
      headlines: ["Headline A", "Headline B"],
      predictFuturePrice: () => 83.333,
      classifyTrend: () => "BULLISH",
      analyzeOilSentiment: () => ({
        score: 4,
        mood: "OPTIMISTIC",
        topKeywords: ["opec", "supply"],
      }),
      getRegionalPrice: (usd) => usd * 55,
      getDieselPerLiter: (usd) => usd * 20,
    });

    expect(fetchOilPrice).toHaveBeenCalledTimes(2);
    expect(snapshot.price.usd).toBe(82.5);
    expect(snapshot.price.php).toBeCloseTo(4537.5, 5);
    expect(snapshot.diesel.phpPerLiter).toBe(84);
    expect(snapshot.diesel.usdPerGallon).toBe(4.2);
    expect(snapshot.intelligence.forecast).toBe(83.33);
    expect(snapshot.intelligence.trend).toBe("BULLISH");
    expect(snapshot.intelligence.mood).toBe("OPTIMISTIC");
    expect(snapshot.history).toHaveLength(2);
  });

  it("propagates upstream fetch failures", async () => {
    const fetchOilPrice = vi
      .fn<[string], Promise<OilPriceData>>()
      .mockRejectedValue(new Error("boom"));

    await expect(
      buildDashboardSnapshot({
        fetchOilPrice,
      }),
    ).rejects.toThrow("boom");
  });
});
