import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Service to interact with external Water/Oil price oracles.
 * Following SRP: This module only handles external data fetching and validation.
 */

const OilPriceSchema = z.object({
  status: z.string(),
  data: z.object({
    price: z.number(),
    currency: z.string(),
    code: z.string(),
    timestamp: z.string(),
  }),
});

export type OilPriceData = z.infer<typeof OilPriceSchema>["data"];

export async function fetchOilPrice(assetCode: string = "WTI_USD"): Promise<OilPriceData> {
  const url = `https://api.oilpriceapi.com/v1/prices/latest?by_code=${assetCode}`;

  logger.info({ assetCode, url }, "Fetching real-time oil price");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${env.OIL_PRICE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ status: response.status, errorBody }, "OilPriceAPI request failed");
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  const rawData = await response.json();
  const parsed = OilPriceSchema.safeParse(rawData);

  if (!parsed.success) {
    logger.error({ error: parsed.error.format() }, "API Response validation failed");
    throw new Error("Invalid response format from OilPriceAPI");
  }

  return parsed.data.data;
}
