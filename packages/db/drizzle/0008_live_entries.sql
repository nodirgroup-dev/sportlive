DO $$ BEGIN
  CREATE TYPE "public"."live_entry_type" AS ENUM(
    'comment','goal','yellow_card','red_card','sub','var',
    'kickoff','half_time','full_time','general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "live_entries" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "live_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "fixture_id" integer NOT NULL,
  "minute" smallint,
  "type" "live_entry_type" DEFAULT 'comment' NOT NULL,
  "body" text NOT NULL,
  "embed_url" varchar(500),
  "author_id" integer,
  "pinned" smallint DEFAULT 0 NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "live_entries" ADD CONSTRAINT "live_entries_fixture_fk"
    FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "live_entries" ADD CONSTRAINT "live_entries_author_fk"
    FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "live_entries_fixture_idx" ON "live_entries" ("fixture_id","occurred_at");
CREATE INDEX IF NOT EXISTS "live_entries_pinned_idx" ON "live_entries" ("fixture_id","pinned");
