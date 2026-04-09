import { classifyTrend, predictFuturePrice } from "@/lib/intelligence/forecasting";
import { analyzeOilSentiment, MOCK_OIL_HEADLINES } from "@/lib/intelligence/sentiment";
import { fetchOilPrice, type OilPriceData } from "@/lib/oil-api";
import { getDieselPerLiter, getRegionalPrice } from "@/lib/regional";

export const MOCK_HISTORY = [
  { date: "Apr 01", price: 78.4 },
  { date: "Apr 02", price: 79.1 },
  { date: "Apr 03", price: 80.5 },
  { date: "Apr 04", price: 81.2 },
  { date: "Apr 05", price: 79.8 },
  { date: "Apr 06", price: 80.4 },
  { date: "Apr 07", price: 82.1 },
  { date: "Apr 08", price: 83.5 },
];

type FetchOilPrice = (assetCode: string) => Promise<OilPriceData>;
type HistoryPoint = { date: string; price: number };

type DashboardBuilderDeps = {
  analyzeOilSentiment: typeof analyzeOilSentiment;
  classifyTrend: typeof classifyTrend;
  fetchOilPrice: FetchOilPrice;
  getDieselPerLiter: typeof getDieselPerLiter;
  getRegionalPrice: typeof getRegionalPrice;
  history: HistoryPoint[];
  headlines: string[];
  predictFuturePrice: typeof predictFuturePrice;
};

const defaultDeps: DashboardBuilderDeps = {
  analyzeOilSentiment,
  classifyTrend,
  fetchOilPrice,
  getDieselPerLiter,
  getRegionalPrice,
  history: MOCK_HISTORY,
  headlines: MOCK_OIL_HEADLINES,
  predictFuturePrice,
};

export type DashboardSnapshot = {
  diesel: {
    change24h: number;
    phpPerLiter: number;
    usdPerGallon: number;
  };
  history: HistoryPoint[];
  intelligence: {
    forecast: number;
    keywords: string[];
    mood: "OPTIMISTIC" | "NEUTRAL" | "CONCERNED";
    sentimentScore: number;
    trend: "BULLISH" | "BEARISH" | "STAGNANT";
  };
  price: {
    change24h: number;
    changeAmount: number;
    php: number;
    usd: number;
  };
};

export async function buildDashboardSnapshot(
  overrides: Partial<DashboardBuilderDeps> = {},
): Promise<DashboardSnapshot> {
  const deps: DashboardBuilderDeps = {
    ...defaultDeps,
    ...overrides,
  };

  const [wtiData, dieselData] = await Promise.all([
    deps.fetchOilPrice("WTI_USD"),
    deps.fetchOilPrice("DIESEL_USD"),
  ]);

  const pricesOnly = deps.history.map((point) => point.price);
  const forecast = deps.predictFuturePrice(pricesOnly, 1);
  const trend = deps.classifyTrend(pricesOnly);
  const sentiment = deps.analyzeOilSentiment(deps.headlines);

  return {
    price: {
      usd: wtiData.price,
      php: deps.getRegionalPrice(wtiData.price, "PH"),
      change24h: wtiData.changes?.["24h"]?.percent ?? 0,
      changeAmount: wtiData.changes?.["24h"]?.amount ?? 0,
    },
    diesel: {
      usdPerGallon: dieselData.price,
      phpPerLiter: deps.getDieselPerLiter(dieselData.price, "PH"),
      change24h: dieselData.changes?.["24h"]?.percent ?? 0,
    },
    intelligence: {
      forecast: Math.round(forecast * 100) / 100,
      trend,
      mood: sentiment.mood,
      sentimentScore: sentiment.score,
      keywords: sentiment.topKeywords,
    },
    history: deps.history,
  };
}
