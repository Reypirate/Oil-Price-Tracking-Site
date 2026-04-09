import { SLR } from "ml-regression";

/**
 * Predicts future prices based on a series of historical numbers.
 * Uses a Simple Linear Regression model.
 */
export function predictFuturePrice(history: number[], daysAhead: number = 1): number {
  if (history.length < 2) return history[0] || 0;

  // X is the day index (0, 1, 2...)
  const x = history.map((_, i) => i);
  const y = history;

  const regression = new SLR(x, y);

  // Predict the value at history.length + daysAhead
  return regression.predict(history.length + daysAhead - 1);
}

/**
 * Analyzes momentum to classify the trend.
 */
export function classifyTrend(history: number[]): "BULLISH" | "BEARISH" | "STAGNANT" {
  if (history.length < 5) return "STAGNANT";

  const lastPrice = history[history.length - 1];
  const prevPrice = history[history.length - 5]; // 5-day window
  const percentageChange = (lastPrice - prevPrice) / prevPrice;

  if (percentageChange > 0.02) return "BULLISH";
  if (percentageChange < -0.02) return "BEARISH";
  return "STAGNANT";
}
