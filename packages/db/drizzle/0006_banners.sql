DO $$ BEGIN
  CREATE TYPE "public"."banner_position" AS ENUM('header','sidebar','in_article_top','in_article_bottom','footer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "banners" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "banners_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "name" varchar(200) NOT NULL,
  "position" "banner_position" NOT NULL,
  "image_url" varchar(500) NOT NULL,
  "link_url" varchar(500),
  "alt_text" varchar(300),
  "html_snippet" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "impressions" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "banners_position_idx" ON "banners" ("position","active","sort_order");
CREATE INDEX IF NOT EXISTS "banners_active_idx" ON "banners" ("active");
