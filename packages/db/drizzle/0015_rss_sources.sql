CREATE TABLE IF NOT EXISTS "rss_sources" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "rss_sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "name" varchar(200) NOT NULL,
  "feed_url" varchar(1000) NOT NULL,
  "locale" "locale" NOT NULL,
  "category_id" integer,
  "rewrite_enabled" smallint NOT NULL DEFAULT 0,
  "enabled" smallint NOT NULL DEFAULT 1,
  "last_fetched_at" timestamp with time zone,
  "last_error" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "rss_sources" ADD CONSTRAINT "rss_sources_category_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "rss_sources_enabled_idx" ON "rss_sources" ("enabled", "last_fetched_at");

CREATE TABLE IF NOT EXISTS "rss_imported" (
  "source_id" integer NOT NULL,
  "external_id" varchar(800) NOT NULL,
  "post_id" integer,
  "imported_at" timestamp with time zone NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "rss_imported" ADD CONSTRAINT "rss_imported_source_fk"
    FOREIGN KEY ("source_id") REFERENCES "public"."rss_sources"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "rss_imported_source_idx" ON "rss_imported" ("source_id", "external_id");
