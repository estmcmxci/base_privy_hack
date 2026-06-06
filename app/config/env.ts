import { z } from "zod";

const envSchema = z.object({
  SOUNDCLOUD_CLIENT_ID: z.string().min(1),
  SOUNDCLOUD_CLIENT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1).startsWith("postgres"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).startsWith("postgres"),
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1),
});

const hexString = z.string().regex(/^0x[0-9a-fA-F]+$/, "Must be a 0x-prefixed hex string");

const easEnvSchema = z.object({
  EAS_PRIVATE_KEY: hexString,
  EAS_SCHEMA_UID_PREDICTION: hexString,
  EAS_SCHEMA_UID_REPUTATION: hexString,
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export function getDatabaseUrl(): string {
  const parsed = databaseEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid database environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid database environment variables");
  }

  return parsed.data.DATABASE_URL;
}

export function getCronSecret(): string {
  const parsed = cronEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid cron environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid cron environment variables");
  }

  return parsed.data.CRON_SECRET;
}

export type EasEnv = z.infer<typeof easEnvSchema>;

export function getEasConfig(): EasEnv {
  const parsed = easEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid EAS environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid EAS environment variables");
  }

  return parsed.data;
}

const privyEnvSchema = z.object({
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
  NEXT_PUBLIC_PRIVY_CLIENT_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
});

export type PrivyEnv = z.infer<typeof privyEnvSchema>;

export function getPrivyConfig(): PrivyEnv {
  const parsed = privyEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid Privy environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid Privy environment variables");
  }

  return parsed.data;
}
