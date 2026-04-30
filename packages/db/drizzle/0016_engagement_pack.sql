-- Comment likes + AI moderation score
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "like_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "ai_spam_score" integer;

-- Push category whitelist
ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "category_filters" jsonb;

-- Transfers
CREATE TABLE IF NOT EXISTS "transfers" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transfers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "player_id" integer NOT NULL,
  "team_in_id" integer,
  "team_out_id" integer,
  "transfer_date" timestamp with time zone,
  "type" varchar(32),
  "fetched_at" timestamp with time zone NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_player_fk"
    FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_team_in_fk"
    FOREIGN KEY ("team_in_id") REFERENCES "public"."teams"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_team_out_fk"
    FOREIGN KEY ("team_out_id") REFERENCES "public"."teams"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "transfers_player_idx" ON "transfers" ("player_id", "transfer_date");
CREATE INDEX IF NOT EXISTS "transfers_team_in_idx" ON "transfers" ("team_in_id", "transfer_date");
CREATE INDEX IF NOT EXISTS "transfers_team_out_idx" ON "transfers" ("team_out_id", "transfer_date");

-- Rate limit counters
CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key" varchar(200) PRIMARY KEY,
  "count" integer NOT NULL DEFAULT 1,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "rate_limits_expires_idx" ON "rate_limits" ("expires_at");
