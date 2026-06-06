import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { posts } from "@/app/domains/feed/repo/schema";
import { and, eq, inArray, ne } from "drizzle-orm";

export async function prunePendingCommand() {
  const isDryRun = process.argv.includes("--dry-run");
  const criteria = and(
    eq(predictions.outcome, "pending"),
    ne(predictions.horizon, "1w")
  );

  const result = await db.transaction(async (tx) => {
    const victims = await tx
      .select({
        id: predictions.id,
        createdAt: predictions.createdAt,
        horizon: predictions.horizon,
      })
      .from(predictions)
      .where(criteria);

    if (isDryRun || victims.length === 0) {
      return { victims, deleted: 0 };
    }

    const ids = victims.map((v) => v.id);
    await tx.delete(posts).where(inArray(posts.predictionId, ids));
    const deleted = await tx
      .delete(predictions)
      .where(and(criteria, inArray(predictions.id, ids)))
      .returning({ id: predictions.id });

    return { victims, deleted: deleted.length };
  });

  console.log(`Found ${result.victims.length} non-1w pending predictions:`);
  for (const v of result.victims) {
    console.log(
      `  ${v.id.slice(0, 8)}  ${v.createdAt!.toISOString()}  h=${v.horizon}`
    );
  }

  if (isDryRun) {
    console.log("\n[dry-run] No deletions made.");
  } else if (result.victims.length === 0) {
    console.log("Nothing to prune.");
  } else {
    console.log(`\nDeleted ${result.deleted} predictions (and their posts).`);
    if (result.deleted < result.victims.length) {
      console.log(
        `  Note: ${result.victims.length - result.deleted} selected row(s) changed state mid-transaction and were skipped.`
      );
    }
  }

  process.exit(0);
}
