declare module "ml-regression" {
  export class SLR {
    constructor(x: number[], y: number[]);
    predict(x: number): number;
  }
}

declare module "sentiment" {
  export interface SentimentAnalysisResult {
    score: number;
    comparative: number;
    calculation: Array<Record<string, number>>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  export default class Sentiment {
    analyze(text: string, options?: any): SentimentAnalysisResult;
  }
}
