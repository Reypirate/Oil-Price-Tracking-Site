import { normalizeAssetCode } from "@/lib/assets";
import { logger } from "@/lib/logger";
import type { OilPriceData } from "@/lib/oil-api";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Service to process user-defined price alerts.
 * Following SRP: This module only handles alert matching logic and database updates.
 */

export async function processAlerts(priceData: OilPriceData) {
  const assetCode = normalizeAssetCode(priceData.code);
  logger.info({ assetCode, price: priceData.price }, "Processing alerts");

  const supabaseAdmin = getSupabaseAdmin();

  const selectColumns = "id,asset_code,threshold_price,condition,is_active,triggered_at";
  const baseAlertQuery = () =>
    supabaseAdmin
      .from("alerts")
      .select(selectColumns)
      .eq("asset_code", assetCode)
      .eq("is_active", true)
      .is("triggered_at", null);

  const [aboveResult, belowResult] = await Promise.all([
    baseAlertQuery().eq("condition", "above").lte("threshold_price", priceData.price),
    baseAlertQuery().eq("condition", "below").gte("threshold_price", priceData.price),
  ]);

  if (aboveResult.error || belowResult.error) {
    const message = aboveResult.error?.message || belowResult.error?.message || "Unknown error";
    throw new Error(`Failed to fetch matching alerts: ${message}`);
  }

  const matchedAlerts = [...(aboveResult.data || []), ...(belowResult.data || [])];
  const matchedIds = matchedAlerts.map((alert) => alert.id);

  // 3. (Optional) Dispatch notifications via Resend
  // TODO: Implement Resend integration

  // 4. Update triggered_at in the database for the matched alerts
  if (matchedIds.length > 0) {
    logger.info({ matchedIds }, "Persisting triggered alerts to database");

    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("alerts")
      .update({
        triggered_at: new Date().toISOString(),
        is_active: false,
      })
      .in("id", matchedIds)
      .eq("is_active", true)
      .is("triggered_at", null)
      .select("id");

    if (updateError) {
      logger.error({ err: updateError }, "Failed to update triggered alerts");
      throw new Error(`Persistence Error: ${updateError.message}`);
    }

    const triggeredIds = (updatedRows || []).map((row) => row.id);
    logger.info(
      { matched: matchedIds.length, updated: triggeredIds.length },
      "Successfully updated alert persistence state",
    );

    return {
      assetCode,
      matched: matchedIds.length,
      updated: triggeredIds.length,
      triggeredIds,
    };
  }

  return {
    assetCode,
    matched: 0,
    updated: 0,
    triggeredIds: [],
  };
}
