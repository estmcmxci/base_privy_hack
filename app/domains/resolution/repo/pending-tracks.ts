import { eq, isNotNull, and } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { tracks } from "@/app/domains/soundcloud/repo/schema";

export async function listPendingTracks(): Promise<
  Array<{ trackId: string; trackPermalinkUrl: string }>
> {
  const rows = await db
    .selectDistinct({
      trackId: predictions.trackId,
      trackPermalinkUrl: tracks.permalinkUrl,
    })
    .from(predictions)
    .innerJoin(tracks, eq(predictions.trackId, tracks.id))
    .where(
      and(
        eq(predictions.outcome, "pending"),
        isNotNull(predictions.trackId)
      )
    );

  return rows.filter(
    (r): r is { trackId: string; trackPermalinkUrl: string } =>
      r.trackId !== null && !!r.trackPermalinkUrl?.trim()
  );
}
