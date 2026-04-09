import { z } from "zod";
import { normalizeAssetCode } from "@/lib/assets";
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
const OIL_API_TIMEOUT_MS = 10_000;

export async function fetchOilPrice(assetCode: string = "WTI_USD"): Promise<OilPriceData> {
  const canonicalAssetCode = normalizeAssetCode(assetCode);
  const url = `https://api.oilpriceapi.com/v1/prices/latest?by_code=${canonicalAssetCode}`;
  const apiKey = env.OIL_PRICE_API_KEY;

  if (!apiKey) {
    logger.error("OIL_PRICE_API_KEY is missing");
    throw new Error("Missing OIL_PRICE_API_KEY");
  }

  logger.info({ assetCode: canonicalAssetCode, url }, "Fetching real-time oil price");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OIL_API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error(
        { timeoutMs: OIL_API_TIMEOUT_MS, assetCode: canonicalAssetCode },
        "OilPriceAPI request timed out",
      );
      throw new Error(`OilPriceAPI request timed out after ${OIL_API_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

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
