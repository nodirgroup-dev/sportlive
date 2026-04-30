CREATE TABLE IF NOT EXISTS "post_revisions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "post_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "post_id" integer NOT NULL,
  "title" varchar(300) NOT NULL,
  "summary" text,
  "body" text NOT NULL,
  "cover_image" varchar(500),
  "saved_by_id" integer,
  "saved_by_label" varchar(200),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_post_fk"
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_user_fk"
    FOREIGN KEY ("saved_by_id") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "post_revisions_post_idx" ON "post_revisions" ("post_id", "created_at");
