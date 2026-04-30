-- Players
CREATE TABLE IF NOT EXISTS "players" (
  "id" integer PRIMARY KEY,
  "name" varchar(200) NOT NULL,
  "firstname" varchar(100),
  "lastname" varchar(100),
  "nationality" varchar(100),
  "photo" varchar(500),
  "height" varchar(16),
  "weight" varchar(16),
  "birth_year" smallint,
  "team_id" integer,
  "position" varchar(32),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "players" ADD CONSTRAINT "players_team_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "players_team_idx" ON "players" ("team_id");
CREATE INDEX IF NOT EXISTS "players_nationality_idx" ON "players" ("nationality");

-- Player stats per (player, league, season)
CREATE TABLE IF NOT EXISTS "player_stats" (
  "player_id" integer NOT NULL,
  "league_id" integer NOT NULL,
  "season" integer NOT NULL,
  "team_id" integer,
  "appearances" smallint NOT NULL DEFAULT 0,
  "minutes" integer NOT NULL DEFAULT 0,
  "goals" smallint NOT NULL DEFAULT 0,
  "assists" smallint NOT NULL DEFAULT 0,
  "yellow_cards" smallint NOT NULL DEFAULT 0,
  "red_cards" smallint NOT NULL DEFAULT 0,
  "rating" varchar(8),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("player_id", "league_id", "season")
);

DO $$ BEGIN
  ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_fk"
    FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_league_fk"
    FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_team_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "player_stats_league_season_goals_idx" ON "player_stats" ("league_id", "season", "goals");
CREATE INDEX IF NOT EXISTS "player_stats_league_season_assists_idx" ON "player_stats" ("league_id", "season", "assists");

-- Match lineups
CREATE TABLE IF NOT EXISTS "match_lineups" (
  "fixture_id" integer NOT NULL,
  "team_id" integer NOT NULL,
  "formation" varchar(16),
  "coach_name" varchar(200),
  "start_xi" jsonb,
  "substitutes" jsonb,
  "fetched_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("fixture_id", "team_id")
);

DO $$ BEGIN
  ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_fixture_fk"
    FOREIGN KEY ("fixture_id") REFERENCES "public"."fixtures"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_team_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "match_lineups_fixture_idx" ON "match_lineups" ("fixture_id");
