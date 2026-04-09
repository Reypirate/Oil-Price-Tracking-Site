import { z } from "zod";

/**
 * Service to interact with external Water/Oil price oracles.
 * Following SRP: This module only handles external data fetching and validation.
 */

const OilPriceSchema = z.object({
  price: z.number(),
  currency: z.string(),
  code: z.string(),
  timestamp: z.string(),
});

export type OilPriceData = z.infer<typeof OilPriceSchema>;

export async function fetchOilPrice(assetCode: string = "WTI"): Promise<OilPriceData> {
  // Placeholder for real API call to OilPriceAPI.com
  // In a real scenario, this would use env.OIL_PRICE_API_KEY
  console.log(`Fetching price for ${assetCode}...`);

  // Mock data for now
  return {
    price: 85.42,
    currency: "USD",
    code: assetCode,
    timestamp: new Date().toISOString(),
  };
}
