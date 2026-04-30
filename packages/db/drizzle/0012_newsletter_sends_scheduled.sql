-- Newsletter send log
CREATE TABLE IF NOT EXISTS "newsletter_sends" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "newsletter_sends_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "locale" "locale",
  "subject" varchar(300) NOT NULL,
  "since_cutoff" timestamp with time zone,
  "recipient_count" integer NOT NULL DEFAULT 0,
  "sent_count" integer NOT NULL DEFAULT 0,
  "failed_count" integer NOT NULL DEFAULT 0,
  "error" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "newsletter_sends_created_idx" ON "newsletter_sends" ("created_at");

-- Add 'scheduled' to post_status enum (idempotent)
DO $$ BEGIN
  ALTER TYPE "post_status" ADD VALUE IF NOT EXISTS 'scheduled' BEFORE 'published';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
