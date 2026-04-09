import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AlertCenterServiceError, sendPrimaryProfileTestAlertEmail } from "@/lib/alerts-center";
import { logger } from "@/lib/logger";

const testEmailPayloadSchema = z.object({
  assetCode: z.string().min(1).optional(),
  currentPrice: z.coerce.number().finite().positive(),
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

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const payload = await request.json().catch(() => null);
    const parsed = testEmailPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return buildErrorResponse(
        requestId,
        "Invalid test email payload",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await sendPrimaryProfileTestAlertEmail({
      assetCode: parsed.data.assetCode,
      currentPrice: parsed.data.currentPrice,
      recipientEmail: parsed.data.recipientEmail,
    });

    return buildSuccessResponse(requestId, { result });
  } catch (error: unknown) {
    if (error instanceof AlertCenterServiceError) {
      logger.warn(
        { requestId, status: error.status, details: error.details },
        "Alert center service error in POST /api/alerts/test-email",
      );
      return buildErrorResponse(requestId, error.message, error.status, error.details);
    }

    logger.error({ err: error, requestId }, "Unhandled error in POST /api/alerts/test-email");
    return buildErrorResponse(requestId, "Internal Server Error");
  }
}
