import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";
import { predictions } from "@/app/domains/predictions/repo/schema";

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id").references(() => predictions.id),
    tastemakerId: uuid("tastemaker_id")
      .notNull()
      .references(() => tastemakers.id),
    title: text("title"),
    body: text("body"),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_posts_prediction").on(table.predictionId)]
);
