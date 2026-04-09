import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AlertCenterServiceError, updatePrimaryProfileAlert } from "@/lib/alerts-center";
import { ApiAuthError, requireSupabaseUserId } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

const paramsSchema = z.object({
  alertId: z.string().uuid(),
});

const updateAlertPayloadSchema = z.object({
  isActive: z.boolean(),
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

export async function PATCH(request: Request, context: { params: Promise<{ alertId: string }> }) {
  const requestId = randomUUID();

  try {
    const userId = await requireSupabaseUserId(request);
    const params = await context.params;
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return buildErrorResponse(requestId, "Invalid alert id", 400, parsedParams.error.flatten());
    }

    const payload = await request.json().catch(() => null);
    const parsedBody = updateAlertPayloadSchema.safeParse(payload);
    if (!parsedBody.success) {
      return buildErrorResponse(
        requestId,
        "Invalid alert update payload",
        400,
        parsedBody.error.flatten(),
      );
    }

    const alert = await updatePrimaryProfileAlert({
      userId,
      alertId: parsedParams.data.alertId,
      isActive: parsedBody.data.isActive,
    });

    return buildSuccessResponse(requestId, { alert });
  } catch (error: unknown) {
    if (error instanceof ApiAuthError) {
      logger.warn(
        { requestId, status: error.status },
        "Unauthorized PATCH /api/alerts/[alertId] request",
      );
      return buildErrorResponse(requestId, error.message, error.status);
    }

    if (error instanceof AlertCenterServiceError) {
      logger.warn(
        { requestId, status: error.status, details: error.details },
        "Alert center service error in PATCH /api/alerts/[alertId]",
      );
      return buildErrorResponse(requestId, error.message, error.status, error.details);
    }

    logger.error({ err: error, requestId }, "Unhandled error in PATCH /api/alerts/[alertId]");
    return buildErrorResponse(requestId, "Internal Server Error");
  }
}
