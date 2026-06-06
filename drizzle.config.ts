import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const ENV_FILES = [".env.local", ".env"];

function readDatabaseUrlFromFile(fileName: string): string | undefined {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return undefined;
  }

  const envFile = readFileSync(filePath, "utf8");
  const match = envFile.match(/^DATABASE_URL=(.+)$/m);
  const raw = match?.[1]?.trim();
  // Strip surrounding single or double quotes if present
  return raw?.replace(/^["'](.*)["']$/, "$1");
}

// Prefer workspace-local overrides so Drizzle can use the Supabase pooler
// even when a shared `.env` still points at the direct IPv6-only host.
const databaseUrl =
  ENV_FILES.map((fileName) => readDatabaseUrlFromFile(fileName)).find(Boolean) ??
  process.env.DATABASE_URL;

if (typeof databaseUrl !== "string" || databaseUrl.length === 0) {
  throw new Error("DATABASE_URL is required for Drizzle");
}

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./app/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
