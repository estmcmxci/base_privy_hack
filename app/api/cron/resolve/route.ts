import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCronSecret } from "@/app/config/env";
import { runWeeklyResolution } from "@/app/domains/resolution/service/weekly-resolution";

const cronHeadersSchema = z.object({
  authorization: z.string().regex(/^Bearer\s+\S+$/).optional(),
  "x-cron-secret": z.string().min(1).optional(),
  "cron-secret": z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

function getProvidedSecret(request: NextRequest): string | null {
  const parsedHeaders = cronHeadersSchema.safeParse({
    authorization: request.headers.get("authorization") ?? undefined,
    "x-cron-secret": request.headers.get("x-cron-secret") ?? undefined,
    "cron-secret": request.headers.get("cron-secret") ?? undefined,
    CRON_SECRET: request.headers.get("CRON_SECRET") ?? undefined,
  });

  if (!parsedHeaders.success) {
    return null;
  }

  const bearerSecret = parsedHeaders.data.authorization?.replace(/^Bearer\s+/, "");
  return (
    parsedHeaders.data.CRON_SECRET ??
    parsedHeaders.data["cron-secret"] ??
    parsedHeaders.data["x-cron-secret"] ??
    bearerSecret ??
    null
  );
}

function isAuthorized(request: NextRequest): boolean {
  const providedSecret = getProvidedSecret(request);
  return providedSecret !== null && providedSecret === getCronSecret();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklyResolution(new Date());

  return NextResponse.json(result, { status: 200 });
}
