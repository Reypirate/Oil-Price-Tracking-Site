import Sentiment from "sentiment";

const analyzer = new Sentiment();

export type MarketMood = "OPTIMISTIC" | "NEUTRAL" | "CONCERNED";

/**
 * Analyzes market sentiment based on a set of headlines.
 * We prioritize 'understandable' labels for non-experts.
 */
export function analyzeOilSentiment(headlines: string[]): {
  score: number;
  mood: MarketMood;
  topKeywords: string[];
} {
  if (headlines.length === 0) {
    return { score: 0, mood: "NEUTRAL", topKeywords: [] };
  }

  const combinedText = headlines.join(" ");
  const result = analyzer.analyze(combinedText);

  let mood: MarketMood = "NEUTRAL";
  if (result.score > 2) mood = "OPTIMISTIC";
  if (result.score < -2) mood = "CONCERNED";

  // Simple keyword extraction from the sentiment analysis result
  const topKeywords = result.words.slice(0, 5);

  return {
    score: result.score,
    mood,
    topKeywords,
  };
}

/**
 * Mocked News Feed for demonstration until a real News API is connected.
 */
export const MOCK_OIL_HEADLINES = [
  "OPEC+ agrees to extend production cuts into 2026",
  "Middle East tensions spark supply concerns in global markets",
  "US oil inventories show unexpected build, prices soften",
  "IEA forecasts record global demand for crude oil",
  "Green energy transition accelerates, long-term oil outlook remains steady",
];
