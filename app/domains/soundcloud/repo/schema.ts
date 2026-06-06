import { pgTable, uuid, text, bigint, timestamp, index } from "drizzle-orm/pg-core";

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  soundcloudId: bigint("soundcloud_id", { mode: "bigint" }).unique(),
  username: text("username").notNull(),
  permalinkUrl: text("permalink_url"),
  avatarUrl: text("avatar_url"),
  city: text("city"),
  countryCode: text("country_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const catalogSnapshots = pgTable(
  "catalog_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    totalPlays: bigint("total_plays", { mode: "bigint" }),
    totalLikes: bigint("total_likes", { mode: "bigint" }),
    totalReposts: bigint("total_reposts", { mode: "bigint" }),
    totalComments: bigint("total_comments", { mode: "bigint" }),
    followersCount: bigint("followers_count", { mode: "bigint" }),
    trackCount: bigint("track_count", { mode: "bigint" }),
    tracksFetched: bigint("tracks_fetched", { mode: "bigint" }),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_snapshots_artist").on(table.artistId)]
);

export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  soundcloudId: bigint("soundcloud_id", { mode: "bigint" }).unique(),
  title: text("title").notNull(),
  permalinkUrl: text("permalink_url"),
  artworkUrl: text("artwork_url"),
  artistId: uuid("artist_id").references(() => artists.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const trackSnapshots = pgTable(
  "track_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id),
    playbackCount: bigint("playback_count", { mode: "bigint" }),
    likesCount: bigint("likes_count", { mode: "bigint" }),
    repostsCount: bigint("reposts_count", { mode: "bigint" }),
    commentCount: bigint("comment_count", { mode: "bigint" }),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_track_snapshots_track").on(table.trackId)]
);
