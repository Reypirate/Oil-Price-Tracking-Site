/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
