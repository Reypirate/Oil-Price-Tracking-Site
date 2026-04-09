import { getSupabase } from "@/lib/supabase";

export type AlertCondition = "above" | "below";
export type MailDeliveryMode = "maildev" | "resend";

export type AlertRecord = {
  assetCode: string;
  condition: AlertCondition;
  createdAt: string;
  id: string;
  isActive: boolean;
  thresholdPrice: number;
  triggeredAt: string | null;
};

type AlertsListData = {
  alerts: AlertRecord[];
  profileEmail: string | null;
};

type AlertMutationData = {
  alert: AlertRecord;
};

type TestAlertEmailData = {
  result: {
    assetCode: string;
    currentPrice: number;
    deliveryMode: MailDeliveryMode;
    recipientEmail: string;
    thresholdPrice: number;
  };
};

type ApiResponse<T> = {
  data?: T;
  details?: unknown;
  error?: string;
  success: boolean;
};

function toErrorMessage(payload: ApiResponse<unknown>, fallbackMessage: string): string {
  if (payload.error) {
    return payload.error;
  }
  return fallbackMessage;
}

async function buildAuthHeaders(contentType = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  const { data } = await getSupabase().auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

export async function fetchAlerts(): Promise<AlertsListData> {
  const response = await fetch("/api/alerts", {
    cache: "no-store",
    headers: await buildAuthHeaders(),
  });
  const payload = (await response.json()) as ApiResponse<AlertsListData>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(toErrorMessage(payload, `Failed to fetch alerts (${response.status})`));
  }

  return payload.data;
}

export async function createAlert(payload: {
  assetCode: string;
  condition: AlertCondition;
  recipientEmail?: string;
  thresholdPrice: number;
}): Promise<AlertRecord> {
  const response = await fetch("/api/alerts", {
    method: "POST",
    headers: await buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as ApiResponse<AlertMutationData>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(toErrorMessage(json, `Failed to create alert (${response.status})`));
  }

  return json.data.alert;
}

export async function updateAlert(
  alertId: string,
  payload: { isActive: boolean },
): Promise<AlertRecord> {
  const response = await fetch(`/api/alerts/${alertId}`, {
    method: "PATCH",
    headers: await buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as ApiResponse<AlertMutationData>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(toErrorMessage(json, `Failed to update alert (${response.status})`));
  }

  return json.data.alert;
}

export async function sendTestAlertEmail(payload: {
  assetCode?: string;
  currentPrice: number;
  deliveryMode?: MailDeliveryMode;
  recipientEmail?: string;
}) {
  const response = await fetch("/api/alerts/test-email", {
    method: "POST",
    headers: await buildAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as ApiResponse<TestAlertEmailData>;
  if (!response.ok || !json.success || !json.data) {
    throw new Error(toErrorMessage(json, `Failed to send test email (${response.status})`));
  }

  return json.data.result;
}
