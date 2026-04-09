import { normalizeAssetCode } from "@/lib/assets";
import { logger } from "@/lib/logger";
import { sendPriceAlertEmail } from "@/lib/notifications";
import { getSupabaseAdmin } from "@/lib/supabase";

export type AlertCenterRecord = {
  assetCode: string;
  condition: "above" | "below";
  createdAt: string;
  id: string;
  isActive: boolean;
  thresholdPrice: number;
  triggeredAt: string | null;
};

export type TestAlertEmailResult = {
  assetCode: string;
  currentPrice: number;
  recipientEmail: string;
  thresholdPrice: number;
};

type AlertRow = {
  asset_code: string;
  condition: "above" | "below";
  created_at: string;
  id: string;
  is_active: boolean;
  threshold_price: number | string;
  triggered_at: string | null;
};

type ProfileRow = {
  email: string | null;
  id: string;
};

export class AlertCenterServiceError extends Error {
  details?: unknown;
  status: number;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "AlertCenterServiceError";
    this.status = status;
    this.details = details;
  }
}

const ALERT_SELECT_COLUMNS =
  "id,asset_code,condition,threshold_price,is_active,triggered_at,created_at";

function mapAlertRow(row: AlertRow): AlertCenterRecord {
  return {
    id: row.id,
    assetCode: row.asset_code,
    condition: row.condition,
    thresholdPrice: Number(row.threshold_price),
    isActive: row.is_active,
    triggeredAt: row.triggered_at,
    createdAt: row.created_at,
  };
}

type SupabaseErrorLike = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message: string;
};

function mapSupabaseError(error: SupabaseErrorLike): AlertCenterServiceError {
  const message = error.message || "Unknown Supabase error";
  const lower = message.toLowerCase();

  if (
    message.includes('relation "profiles" does not exist') ||
    (lower.includes("table") && lower.includes("profiles") && lower.includes("schema cache"))
  ) {
    return new AlertCenterServiceError(
      "Profiles table is missing. Run supabase/schema.sql in Supabase SQL editor.",
      500,
      error,
    );
  }

  if (
    message.includes('relation "alerts" does not exist') ||
    (lower.includes("table") && lower.includes("alerts") && lower.includes("schema cache"))
  ) {
    return new AlertCenterServiceError(
      "Alerts table is missing. Run supabase/schema.sql in Supabase SQL editor.",
      500,
      error,
    );
  }

  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return new AlertCenterServiceError(
      "Supabase service role key is invalid. Check SUPABASE_SERVICE_ROLE_KEY.",
      500,
      error,
    );
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return new AlertCenterServiceError(
      "Supabase permissions are blocking alert operations. Verify RLS policies and service key.",
      500,
      error,
    );
  }

  if (process.env.NODE_ENV !== "production") {
    return new AlertCenterServiceError(`Alert service failed: ${message}`, 500, error);
  }

  return new AlertCenterServiceError("Internal Server Error", 500, error);
}

async function getPrimaryProfile(): Promise<ProfileRow> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,email")
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, "Failed to resolve primary profile for alert center");
    throw mapSupabaseError(error as SupabaseErrorLike);
  }

  if (!data) {
    throw new AlertCenterServiceError(
      "No profile found. Sign in once with Supabase Auth to create your profile before managing alerts.",
      404,
    );
  }

  return data as ProfileRow;
}

export async function listPrimaryProfileAlerts(
  includeInactive: boolean,
): Promise<{ alerts: AlertCenterRecord[]; profileEmail: string | null }> {
  const profile = await getPrimaryProfile();

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("alerts")
    .select(ALERT_SELECT_COLUMNS)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (!includeInactive) {
    query = query.eq("is_active", true).is("triggered_at", null);
  }

  const { data, error } = await query;
  if (error) {
    logger.error({ err: error }, "Failed to fetch alerts for primary profile");
    throw mapSupabaseError(error as SupabaseErrorLike);
  }

  return {
    profileEmail: profile.email,
    alerts: (data ?? []).map((row) => mapAlertRow(row as AlertRow)),
  };
}

export async function createPrimaryProfileAlert(input: {
  assetCode: string;
  condition: "above" | "below";
  recipientEmail?: string;
  thresholdPrice: number;
}): Promise<AlertCenterRecord> {
  const profile = await getPrimaryProfile();
  const supabaseAdmin = getSupabaseAdmin();
  const normalizedAssetCode = normalizeAssetCode(input.assetCode);
  const normalizedRecipientEmail = input.recipientEmail?.trim();

  if (normalizedRecipientEmail && normalizedRecipientEmail !== profile.email) {
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ email: normalizedRecipientEmail })
      .eq("id", profile.id);

    if (profileUpdateError) {
      logger.error({ err: profileUpdateError }, "Failed to update primary profile email");
      throw mapSupabaseError(profileUpdateError as SupabaseErrorLike);
    }
  }

  const { data, error } = await supabaseAdmin
    .from("alerts")
    .insert({
      user_id: profile.id,
      asset_code: normalizedAssetCode,
      condition: input.condition,
      threshold_price: input.thresholdPrice,
      is_active: true,
      triggered_at: null,
    })
    .select(ALERT_SELECT_COLUMNS)
    .single();

  if (error) {
    logger.error({ err: error }, "Failed to create alert for primary profile");
    throw mapSupabaseError(error as SupabaseErrorLike);
  }

  return mapAlertRow(data as AlertRow);
}

export async function updatePrimaryProfileAlert(input: {
  alertId: string;
  isActive: boolean;
}): Promise<AlertCenterRecord> {
  const profile = await getPrimaryProfile();
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("alerts")
    .update({ is_active: input.isActive })
    .eq("id", input.alertId)
    .eq("user_id", profile.id)
    .select(ALERT_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    logger.error({ err: error }, "Failed to update alert for primary profile");
    throw mapSupabaseError(error as SupabaseErrorLike);
  }

  if (!data) {
    throw new AlertCenterServiceError("Alert not found", 404);
  }

  return mapAlertRow(data as AlertRow);
}

export async function sendPrimaryProfileTestAlertEmail(input: {
  assetCode?: string;
  currentPrice: number;
  recipientEmail?: string;
}): Promise<TestAlertEmailResult> {
  const profile = await getPrimaryProfile();
  const supabaseAdmin = getSupabaseAdmin();
  const normalizedRecipientEmail = input.recipientEmail?.trim() || profile.email;

  if (!normalizedRecipientEmail) {
    throw new AlertCenterServiceError("Recipient email is required.", 400);
  }

  if (input.recipientEmail?.trim() && input.recipientEmail.trim() !== profile.email) {
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ email: input.recipientEmail.trim() })
      .eq("id", profile.id);

    if (profileUpdateError) {
      logger.error({ err: profileUpdateError }, "Failed to update primary profile email");
      throw mapSupabaseError(profileUpdateError as SupabaseErrorLike);
    }
  }

  const assetCode = normalizeAssetCode(input.assetCode || "WTI_USD");
  const currentPrice = Number(input.currentPrice);
  const safeCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0 ? currentPrice : 80;
  const thresholdPrice = Math.max(0.01, Number((safeCurrentPrice - 1).toFixed(2)));

  const sent = await sendPriceAlertEmail({
    to: normalizedRecipientEmail,
    assetCode,
    condition: "above",
    thresholdPrice,
    currentPrice: safeCurrentPrice,
  });

  if (!sent) {
    throw new AlertCenterServiceError(
      "Test email failed to send. Check MAIL_MODE and Maildev/Resend configuration.",
      500,
    );
  }

  return {
    recipientEmail: normalizedRecipientEmail,
    assetCode,
    currentPrice: safeCurrentPrice,
    thresholdPrice,
  };
}
