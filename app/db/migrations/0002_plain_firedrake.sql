CREATE TABLE "track_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"playback_count" bigint,
	"likes_count" bigint,
	"reposts_count" bigint,
	"comment_count" bigint,
	"taken_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soundcloud_id" bigint,
	"title" text NOT NULL,
	"permalink_url" text,
	"artwork_url" text,
	"artist_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tracks_soundcloud_id_unique" UNIQUE("soundcloud_id")
);
--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "track_id" uuid;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "track_snapshot_id" uuid;--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "resolution_track_snapshot_id" uuid;--> statement-breakpoint
ALTER TABLE "track_snapshots" ADD CONSTRAINT "track_snapshots_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_track_snapshots_track" ON "track_snapshots" USING btree ("track_id");--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_track_snapshot_id_track_snapshots_id_fk" FOREIGN KEY ("track_snapshot_id") REFERENCES "public"."track_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_resolution_track_snapshot_id_track_snapshots_id_fk" FOREIGN KEY ("resolution_track_snapshot_id") REFERENCES "public"."track_snapshots"("id") ON DELETE no action ON UPDATE no action;