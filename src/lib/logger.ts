import pino from "pino";

/**
 * Custom Serializers for better observability
 * Especially useful for structured logging of complex objects like Supabase errors.
 */
const serializers = {
  // Supabase/Postgres Error Serializer
  supabaseError: (err: any) => {
    return {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint,
    };
  },
};

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Global Logger Instance
 * Configured for structured NDJSON in production and readable formatting in development.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers,
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

export default logger;
