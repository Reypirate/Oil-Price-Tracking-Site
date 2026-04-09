import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

type PriceAlertEmailPayload = {
  assetCode: string;
  condition: "above" | "below";
  currentPrice: number;
  thresholdPrice: number;
  to: string;
};

let resendClient: Resend | undefined;
let maildevTransporter: Transporter | undefined;

const DEFAULT_MAILDEV_HOST = "127.0.0.1";
const DEFAULT_MAILDEV_PORT = 1025;
const DEFAULT_FROM_EMAIL = "alerts@local.test";

function getMailMode(): "resend" | "maildev" {
  return env.MAIL_MODE === "maildev" ? "maildev" : "resend";
}

function getMailFrom(): string {
  return env.ALERT_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

function getMaildevTransporter(): Transporter {
  if (!maildevTransporter) {
    const port = Number(env.MAILDEV_PORT ?? DEFAULT_MAILDEV_PORT);
    const host = env.MAILDEV_HOST || DEFAULT_MAILDEV_HOST;

    maildevTransporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true,
    });
  }

  return maildevTransporter;
}

function buildAlertEmail(payload: PriceAlertEmailPayload) {
  const direction = payload.condition === "above" ? "rose above" : "fell below";
  const subject = `${payload.assetCode} alert triggered: ${direction} $${payload.thresholdPrice.toFixed(2)}`;
  const text = [
    "Price Alert Triggered",
    "",
    `Asset: ${payload.assetCode}`,
    `Condition: ${payload.condition}`,
    `Threshold: $${payload.thresholdPrice.toFixed(2)}`,
    `Current Price: $${payload.currentPrice.toFixed(2)}`,
    "",
    "This alert has been marked as inactive after triggering.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">Price Alert Triggered</h2>
      <p>Your alert for <strong>${payload.assetCode}</strong> was triggered.</p>
      <ul>
        <li>Condition: <strong>${payload.condition}</strong></li>
        <li>Threshold: <strong>$${payload.thresholdPrice.toFixed(2)}</strong></li>
        <li>Current Price: <strong>$${payload.currentPrice.toFixed(2)}</strong></li>
      </ul>
      <p>This alert has been marked as inactive after triggering.</p>
    </div>
  `;

  return { html, subject, text };
}

async function sendViaResend(payload: PriceAlertEmailPayload): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    logger.warn("Email delivery skipped: RESEND_API_KEY is not configured");
    return false;
  }

  const { html, subject } = buildAlertEmail(payload);

  const { error } = await client.emails.send({
    from: `Oil Price Tracker <${getMailFrom()}>`,
    to: payload.to,
    subject,
    html,
  });

  if (error) {
    logger.error(
      { err: error, to: payload.to, assetCode: payload.assetCode },
      "Failed to send price alert email",
    );
    return false;
  }

  return true;
}

async function sendViaMaildev(payload: PriceAlertEmailPayload): Promise<boolean> {
  const transporter = getMaildevTransporter();
  const { html, subject, text } = buildAlertEmail(payload);

  try {
    await transporter.sendMail({
      from: `Oil Price Tracker <${getMailFrom()}>`,
      to: payload.to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error: unknown) {
    logger.error(
      { err: error, to: payload.to, assetCode: payload.assetCode },
      "Failed to send price alert email via Maildev",
    );
    return false;
  }
}

export async function sendPriceAlertEmail(payload: PriceAlertEmailPayload): Promise<boolean> {
  if (getMailMode() === "maildev") {
    return sendViaMaildev(payload);
  }

  return sendViaResend(payload);
}
