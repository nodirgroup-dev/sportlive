CREATE TABLE IF NOT EXISTS "standings" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "standings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "league_id" integer NOT NULL,
  "season" integer NOT NULL,
  "team_id" integer NOT NULL,
  "rank" smallint NOT NULL,
  "group_name" varchar(50),
  "points" smallint DEFAULT 0 NOT NULL,
  "played" smallint DEFAULT 0 NOT NULL,
  "won" smallint DEFAULT 0 NOT NULL,
  "drew" smallint DEFAULT 0 NOT NULL,
  "lost" smallint DEFAULT 0 NOT NULL,
  "goals_for" smallint DEFAULT 0 NOT NULL,
  "goals_against" smallint DEFAULT 0 NOT NULL,
  "goals_diff" smallint DEFAULT 0 NOT NULL,
  "form" varchar(10),
  "description" varchar(200),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "standings" ADD CONSTRAINT "standings_league_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "standings" ADD CONSTRAINT "standings_team_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "standings_unique_idx" ON "standings" ("league_id","season","team_id","group_name");
CREATE INDEX IF NOT EXISTS "standings_league_rank_idx" ON "standings" ("league_id","season","rank");
