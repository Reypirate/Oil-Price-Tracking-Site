import { getSupabaseAdmin } from "@/lib/supabase";
import type { OilPriceData } from "./oil-api";

/**
 * Service to process user-defined price alerts.
 * Following SRP: This module only handles alert matching logic and database updates.
 */

export async function processAlerts(priceData: OilPriceData) {
  console.log(`Processing alerts for ${priceData.code} at price ${priceData.price}...`);

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Fetch active alerts from Supabase for this asset code
  // This uses supabaseAdmin to bypass RLS for background processing
  const { data: alerts, error } = await supabaseAdmin
    .from("alerts")
    .select("*")
    .eq("asset_code", priceData.code)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }

  // 2. Logic to filter alerts that meet the threshold condition
  const triggeredAlerts = alerts.filter((alert) => {
    if (alert.condition === "above") {
      return priceData.price >= Number(alert.threshold_price);
    } else if (alert.condition === "below") {
      return priceData.price <= Number(alert.threshold_price);
    }
    return false;
  });

  // 3. (Optional) Dispatch notifications via Resend
  // 4. Update triggered_at in the database for the matched alerts

  return {
    scanned: alerts.length,
    triggered: triggeredAlerts.length,
    alerts: triggeredAlerts,
  };
}
