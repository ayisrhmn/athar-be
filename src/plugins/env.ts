import { z } from "zod";
import { config } from "dotenv";

config();

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  DATABASE_URL: z.url().min(1),
  API_PREFIX: z.string().min(1),
  PORT: z.coerce.number().min(1).max(65535).default(3333),
  // CORS origins (comma-separated list for production)
  CORS_ORIGIN: z.string().default("*"),
  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  RATE_LIMIT_TIME_WINDOW: z.string().default("15 minutes"),
});

// Validate and parse environment variables
// Will throw error if validation fails, preventing app startup
export const env = envSchema.parse(process.env);
