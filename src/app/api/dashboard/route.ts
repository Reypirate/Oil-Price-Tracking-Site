import { NextResponse } from "next/server";
import { classifyTrend, predictFuturePrice } from "@/lib/intelligence/forecasting";
import { analyzeOilSentiment, MOCK_OIL_HEADLINES } from "@/lib/intelligence/sentiment";
import { fetchOilPrice } from "@/lib/oil-api";
import { getDieselPerLiter, getRegionalPrice } from "@/lib/regional";

/**
 * Controller: /api/dashboard
 * Orchestrates all Model-layer calls and returns a single payload
 * for the View layer to consume. This keeps server-only deps (pino, env)
 * safely on the server side.
 */

const MOCK_HISTORY = [
  { date: "Apr 01", price: 78.4 },
  { date: "Apr 02", price: 79.1 },
  { date: "Apr 03", price: 80.5 },
  { date: "Apr 04", price: 81.2 },
  { date: "Apr 05", price: 79.8 },
  { date: "Apr 06", price: 80.4 },
  { date: "Apr 07", price: 82.1 },
  { date: "Apr 08", price: 83.5 },
];

export async function GET() {
  try {
    // Fetch WTI Crude and Diesel in parallel
    const [wtiData, dieselData] = await Promise.all([
      fetchOilPrice("WTI_USD"),
      fetchOilPrice("DIESEL_USD"),
    ]);

    const pricesOnly = MOCK_HISTORY.map((h) => h.price);
    const forecast = predictFuturePrice(pricesOnly, 1);
    const trend = classifyTrend(pricesOnly);
    const sentiment = analyzeOilSentiment(MOCK_OIL_HEADLINES);

    return NextResponse.json({
      price: {
        usd: wtiData.price,
        sgd: getRegionalPrice(wtiData.price, "SG"),
        php: getRegionalPrice(wtiData.price, "PH"),
        change24h: wtiData.changes?.["24h"]?.percent ?? 0,
        changeAmount: wtiData.changes?.["24h"]?.amount ?? 0,
      },
      diesel: {
        usdPerGallon: dieselData.price,
        sgdPerLiter: getDieselPerLiter(dieselData.price, "SG"),
        phpPerLiter: getDieselPerLiter(dieselData.price, "PH"),
        change24h: dieselData.changes?.["24h"]?.percent ?? 0,
      },
      intelligence: {
        forecast: Math.round(forecast * 100) / 100,
        trend,
        mood: sentiment.mood,
        sentimentScore: sentiment.score,
        keywords: sentiment.topKeywords,
      },
      history: MOCK_HISTORY,
    });
  } catch (error) {
    console.error("[/api/dashboard] Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
