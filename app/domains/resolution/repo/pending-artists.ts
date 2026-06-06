import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { artists } from "@/app/domains/soundcloud/repo/schema";

export async function listPendingArtists(): Promise<
  Array<{ artistId: string; permalinkUrl: string }>
> {
  const rows = await db
    .selectDistinct({
      artistId: predictions.artistId,
      permalinkUrl: artists.permalinkUrl,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .where(eq(predictions.outcome, "pending"));

  return rows.filter(
    (r): r is { artistId: string; permalinkUrl: string } =>
      r.permalinkUrl !== null
  );
}
