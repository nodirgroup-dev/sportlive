CREATE TABLE IF NOT EXISTS "static_pages" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "static_pages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "legacy_id" integer,
  "locale" "locale" NOT NULL,
  "slug" varchar(200) NOT NULL,
  "title" varchar(300) NOT NULL,
  "description" varchar(500),
  "body" text NOT NULL,
  "meta_title" varchar(300),
  "meta_description" varchar(500),
  "meta_keywords" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "show_in_footer" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "static_pages_locale_slug_idx" ON "static_pages" ("locale", "slug");
CREATE INDEX IF NOT EXISTS "static_pages_legacy_idx" ON "static_pages" ("legacy_id");
