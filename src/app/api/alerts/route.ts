import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AlertCenterServiceError,
  createPrimaryProfileAlert,
  listPrimaryProfileAlerts,
} from "@/lib/alerts-center";
import { ApiAuthError, requireSupabaseUserId } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

const createAlertPayloadSchema = z.object({
  assetCode: z.string().min(1),
  condition: z.enum(["above", "below"]),
  thresholdPrice: z.coerce.number().finite().positive(),
  recipientEmail: z.string().email().optional(),
});

function buildErrorResponse(requestId: string, message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    {
      status,
      headers: {
        "X-Request-Id": requestId,
      },
    },
  );
}

function buildSuccessResponse(requestId: string, data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    {
      status,
      headers: {
        "X-Request-Id": requestId,
      },
    },
  );
}

export async function GET(request: Request) {
  const requestId = randomUUID();

  try {
    const userId = await requireSupabaseUserId(request);
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const data = await listPrimaryProfileAlerts(userId, includeInactive);

    return buildSuccessResponse(requestId, data);
  } catch (error: unknown) {
    if (error instanceof ApiAuthError) {
      logger.warn({ requestId, status: error.status }, "Unauthorized GET /api/alerts request");
      return buildErrorResponse(requestId, error.message, error.status);
    }

    if (error instanceof AlertCenterServiceError) {
      logger.warn(
        { requestId, status: error.status, details: error.details },
        "Alert center service error in GET /api/alerts",
      );
      return buildErrorResponse(requestId, error.message, error.status, error.details);
    }

    logger.error({ err: error, requestId }, "Unhandled error in GET /api/alerts");
    return buildErrorResponse(requestId, "Internal Server Error");
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const userId = await requireSupabaseUserId(request);
    const payload = await request.json().catch(() => null);
    const parsed = createAlertPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return buildErrorResponse(requestId, "Invalid alert payload", 400, parsed.error.flatten());
    }

    const alert = await createPrimaryProfileAlert({
      userId,
      assetCode: parsed.data.assetCode,
      condition: parsed.data.condition,
      thresholdPrice: parsed.data.thresholdPrice,
      recipientEmail: parsed.data.recipientEmail,
    });

    return buildSuccessResponse(requestId, { alert }, 201);
  } catch (error: unknown) {
    if (error instanceof ApiAuthError) {
      logger.warn({ requestId, status: error.status }, "Unauthorized POST /api/alerts request");
      return buildErrorResponse(requestId, error.message, error.status);
    }

    if (error instanceof AlertCenterServiceError) {
      logger.warn(
        { requestId, status: error.status, details: error.details },
        "Alert center service error in POST /api/alerts",
      );
      return buildErrorResponse(requestId, error.message, error.status, error.details);
    }

    logger.error({ err: error, requestId }, "Unhandled error in POST /api/alerts");
    return buildErrorResponse(requestId, "Internal Server Error");
  }
}
