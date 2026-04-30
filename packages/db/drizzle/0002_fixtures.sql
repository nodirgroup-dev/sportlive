CREATE TABLE IF NOT EXISTS "leagues" (
  "id" integer PRIMARY KEY,
  "name" varchar(200) NOT NULL,
  "type" varchar(30),
  "country" varchar(100),
  "country_code" varchar(8),
  "logo" varchar(500),
  "flag" varchar(500),
  "season" integer NOT NULL,
  "season_start" timestamp with time zone,
  "season_end" timestamp with time zone,
  "featured" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "leagues_country_idx" ON "leagues" ("country");
CREATE INDEX IF NOT EXISTS "leagues_featured_idx" ON "leagues" ("featured", "sort_order");

CREATE TABLE IF NOT EXISTS "venues" (
  "id" integer PRIMARY KEY,
  "name" varchar(200) NOT NULL,
  "city" varchar(200),
  "country" varchar(100),
  "capacity" integer,
  "surface" varchar(50),
  "image" varchar(500),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "teams" (
  "id" integer PRIMARY KEY,
  "name" varchar(200) NOT NULL,
  "code" varchar(16),
  "country" varchar(100),
  "logo" varchar(500),
  "venue_id" integer,
  "founded" smallint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "teams_country_idx" ON "teams" ("country");

CREATE TABLE IF NOT EXISTS "fixtures" (
  "id" integer PRIMARY KEY,
  "league_id" integer NOT NULL,
  "season" integer NOT NULL,
  "round" varchar(100),
  "kickoff_at" timestamp with time zone NOT NULL,
  "status_short" varchar(8) NOT NULL,
  "status_long" varchar(64),
  "elapsed" smallint,
  "venue_id" integer,
  "referee_name" varchar(200),
  "home_team_id" integer NOT NULL,
  "away_team_id" integer NOT NULL,
  "home_goals" smallint,
  "away_goals" smallint,
  "score_detail" jsonb,
  "raw" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_league_fk"
    FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_fk"
    FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_fk"
    FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_venue_fk"
    FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "fixtures_kickoff_idx" ON "fixtures" ("kickoff_at");
CREATE INDEX IF NOT EXISTS "fixtures_league_kickoff_idx" ON "fixtures" ("league_id", "kickoff_at");
CREATE INDEX IF NOT EXISTS "fixtures_status_idx" ON "fixtures" ("status_short");
CREATE INDEX IF NOT EXISTS "fixtures_home_team_idx" ON "fixtures" ("home_team_id");
CREATE INDEX IF NOT EXISTS "fixtures_away_team_idx" ON "fixtures" ("away_team_id");
