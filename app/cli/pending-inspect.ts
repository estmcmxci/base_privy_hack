import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { eq } from "drizzle-orm";

export async function pendingInspectCommand() {
  const rows = await db
    .select({
      id: predictions.id,
      createdAt: predictions.createdAt,
      horizon: predictions.horizon,
      threshold: predictions.streamThreshold,
      outcome: predictions.outcome,
    })
    .from(predictions)
    .where(eq(predictions.outcome, "pending"));

  const now = new Date();
  console.log(`now: ${now.toISOString()}`);
  console.log(`pending: ${rows.length}`);
  const hMap: Record<string, number> = { "1w": 7, "2w": 14, "4w": 28, "8w": 56 };
  for (const r of rows) {
    const d = hMap[r.horizon as string] ?? 0;
    const createdAt = r.createdAt!;
    const due = new Date(createdAt.getTime() + d * 24 * 60 * 60 * 1000);
    const dueIn = (due.getTime() - now.getTime()) / 1000 / 3600;
    console.log(
      `  ${r.id.slice(0, 8)}  created=${createdAt.toISOString()}  h=${r.horizon}  due=${due.toISOString()}  dueIn=${dueIn.toFixed(1)}h`
    );
  }
  process.exit(0);
}
