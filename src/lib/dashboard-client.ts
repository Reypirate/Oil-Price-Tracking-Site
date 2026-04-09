export type DashboardSnapshot = {
  diesel: {
    change24h: number;
    phpPerLiter: number;
    sgdPerLiter: number;
    usdPerGallon: number;
  };
  history: Array<{ date: string; price: number }>;
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
    sgd: number;
    usd: number;
  };
};

type DashboardErrorResponse = {
  error?: string;
};

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch("/api/dashboard");
  const payload = (await response.json()) as DashboardSnapshot | DashboardErrorResponse;

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  if ("error" in payload && payload.error) {
    throw new Error(payload.error);
  }

  return payload as DashboardSnapshot;
}
