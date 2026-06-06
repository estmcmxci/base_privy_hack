ALTER TABLE "predictions" DROP CONSTRAINT "chk_outcome";--> statement-breakpoint
ALTER TABLE "predictions" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "chk_outcome" CHECK ("predictions"."outcome" in ('pending', 'yes', 'no', 'void'));