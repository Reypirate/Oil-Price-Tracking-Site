declare module "nodemailer" {
  export type SendMailOptions = {
    from?: string;
    html?: string;
    subject?: string;
    text?: string;
    to?: string;
  };

  export interface SentMessageInfo {
    messageId?: string;
    [key: string]: unknown;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
  }

  export type TransportOptions = {
    host?: string;
    ignoreTLS?: boolean;
    port?: number;
    secure?: boolean;
  };

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
