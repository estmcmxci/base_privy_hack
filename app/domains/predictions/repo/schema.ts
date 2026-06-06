import { sql } from "drizzle-orm";
import { pgTable, uuid, text, bigint, timestamp, index, check } from "drizzle-orm/pg-core";
import { artists, catalogSnapshots, tracks, trackSnapshots } from "@/app/domains/soundcloud/repo/schema";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tastemakerId: uuid("tastemaker_id")
      .notNull()
      .references(() => tastemakers.id),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => catalogSnapshots.id),
    streamThreshold: bigint("stream_threshold", { mode: "bigint" }).notNull(),
    predictedOutcome: text("predicted_outcome").notNull(),
    horizon: text("horizon").notNull(),
    outcome: text("outcome").default("pending"),
    resolutionSnapshotId: uuid("resolution_snapshot_id").references(
      () => catalogSnapshots.id
    ),
    trackId: uuid("track_id").references(() => tracks.id),
    trackSnapshotId: uuid("track_snapshot_id").references(
      () => trackSnapshots.id
    ),
    resolutionTrackSnapshotId: uuid("resolution_track_snapshot_id").references(
      () => trackSnapshots.id
    ),
    easAttestationUid: text("eas_attestation_uid"),
    voidReason: text("void_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_predictions_tastemaker").on(table.tastemakerId),
    index("idx_predictions_outcome").on(table.outcome),
    check("chk_predicted_outcome", sql`${table.predictedOutcome} in ('yes', 'no')`),
    check("chk_horizon", sql`${table.horizon} in ('1w', '2w', '4w', '8w')`),
    check("chk_outcome", sql`${table.outcome} in ('pending', 'yes', 'no', 'void')`),
  ]
);
