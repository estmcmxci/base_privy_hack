import { pgTable, uuid, text, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";

export const tastemakers = pgTable("tastemakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address"),
  displayName: text("display_name"),
  paraUserId: text("para_user_id"),
  memoryProtocolId: text("memory_protocol_id"),
  reputationScore: doublePrecision("reputation_score").default(1.0),
  totalPredictions: integer("total_predictions").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
