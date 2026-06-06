CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"soundcloud_id" bigint,
	"username" text NOT NULL,
	"permalink_url" text,
	"avatar_url" text,
	"city" text,
	"country_code" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "artists_soundcloud_id_unique" UNIQUE("soundcloud_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"total_plays" bigint,
	"total_likes" bigint,
	"total_reposts" bigint,
	"total_comments" bigint,
	"followers_count" bigint,
	"track_count" bigint,
	"tracks_fetched" bigint,
	"taken_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid,
	"tastemaker_id" uuid NOT NULL,
	"title" text,
	"body" text,
	"published" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tastemaker_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"stream_threshold" bigint,
	"predicted_outcome" text NOT NULL,
	"horizon" text NOT NULL,
	"outcome" text DEFAULT 'pending',
	"resolution_snapshot_id" uuid,
	"eas_attestation_uid" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tastemakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text,
	"display_name" text,
	"para_user_id" text,
	"memory_protocol_id" text,
	"reputation_score" double precision DEFAULT 1,
	"total_predictions" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "catalog_snapshots" ADD CONSTRAINT "catalog_snapshots_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_prediction_id_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_tastemaker_id_tastemakers_id_fk" FOREIGN KEY ("tastemaker_id") REFERENCES "public"."tastemakers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_tastemaker_id_tastemakers_id_fk" FOREIGN KEY ("tastemaker_id") REFERENCES "public"."tastemakers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_snapshot_id_catalog_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."catalog_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_resolution_snapshot_id_catalog_snapshots_id_fk" FOREIGN KEY ("resolution_snapshot_id") REFERENCES "public"."catalog_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_snapshots_artist" ON "catalog_snapshots" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "idx_posts_prediction" ON "posts" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "idx_predictions_tastemaker" ON "predictions" USING btree ("tastemaker_id");--> statement-breakpoint
CREATE INDEX "idx_predictions_outcome" ON "predictions" USING btree ("outcome");