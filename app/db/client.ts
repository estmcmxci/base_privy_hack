import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/app/config/env";

const client = postgres(getDatabaseUrl());

export const db = drizzle(client, { schema });
