import { NextResponse } from "next/server";
import { processAlerts } from "@/lib/alerts";
import { normalizeAssetCode } from "@/lib/assets";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { fetchOilPrice } from "@/lib/oil-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // 1. Verify Cron Secret
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch Price from Service Layer
    const currentPriceData = await fetchOilPrice(normalizeAssetCode("WTI"));

    // 3. Process Alerts using the Price Data
    const result = await processAlerts(currentPriceData);

    return NextResponse.json({
      success: true,
      message: "Cron job processed successfully",
      timestamp: new Date().toISOString(),
      details: result,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Cron Error");
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
