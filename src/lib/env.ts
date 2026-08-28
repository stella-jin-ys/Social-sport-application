import { loadEnvFile } from "node:process";
import { z } from "zod";

loadEnvFile(".env");

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
