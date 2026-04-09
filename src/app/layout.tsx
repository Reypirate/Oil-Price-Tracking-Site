import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OilPrice Intelligence - Live Crude Oil Analytics",
  description:
    "Real-time WTI crude oil price tracking with linear regression forecasting, NLP-driven sentiment analysis, and Philippines-focused fuel planning insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
