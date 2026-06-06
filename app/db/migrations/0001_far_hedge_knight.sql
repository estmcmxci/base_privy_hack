ALTER TABLE "predictions" ALTER COLUMN "stream_threshold" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "chk_predicted_outcome" CHECK ("predictions"."predicted_outcome" in ('yes', 'no'));--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "chk_horizon" CHECK ("predictions"."horizon" in ('1w', '2w', '4w', '8w'));--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "chk_outcome" CHECK ("predictions"."outcome" in ('pending', 'yes', 'no'));