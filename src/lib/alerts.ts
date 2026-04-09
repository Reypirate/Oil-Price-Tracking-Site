import { normalizeAssetCode } from "@/lib/assets";
import { logger } from "@/lib/logger";
import { sendPriceAlertEmail } from "@/lib/notifications";
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

  const { data, error } = await supabaseAdmin.rpc("trigger_matching_alerts", {
    p_asset_code: assetCode,
    p_price: priceData.price,
  });

  if (error) {
    logger.error({ err: error }, "Failed to trigger matching alerts");
    throw new Error(`Persistence Error: ${error.message}`);
  }

  const triggeredAlerts = (data ?? []) as Array<{
    asset_code: string;
    condition: "above" | "below";
    email: string | null;
    id: string;
    threshold_price: number;
  }>;
  const triggeredIds = triggeredAlerts.map((row) => row.id);

  // 3. (Optional) Dispatch notifications via Resend
  const notificationResults = await Promise.all(
    triggeredAlerts.map(async (alert) => {
      if (!alert.email) {
        return { id: alert.id, status: "skipped_no_email" as const };
      }

      const sent = await sendPriceAlertEmail({
        to: alert.email,
        assetCode: alert.asset_code,
        condition: alert.condition,
        thresholdPrice: Number(alert.threshold_price),
        currentPrice: priceData.price,
      });

      return {
        id: alert.id,
        status: sent ? ("sent" as const) : ("failed" as const),
      };
    }),
  );

  const notifiedIds = notificationResults
    .filter((result) => result.status === "sent")
    .map((result) => result.id);

  logger.info(
    {
      matched: triggeredIds.length,
      updated: triggeredIds.length,
      notified: notifiedIds.length,
    },
    "Successfully updated alert persistence state",
  );

  return {
    assetCode,
    matched: triggeredIds.length,
    updated: triggeredIds.length,
    notified: notifiedIds.length,
    triggeredIds,
  };
}
