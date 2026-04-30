DO $$ BEGIN
  CREATE TYPE "public"."comment_status" AS ENUM('pending','approved','spam','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "comments" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "legacy_id" integer,
  "post_id" integer NOT NULL,
  "parent_id" integer,
  "user_id" integer,
  "author_name" varchar(100),
  "author_email" varchar(255),
  "author_ip" varchar(45),
  "body" text NOT NULL,
  "status" "comment_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fk"
    FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "comments_post_idx" ON "comments" ("post_id", "status");
CREATE INDEX IF NOT EXISTS "comments_status_idx" ON "comments" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "comments_user_idx" ON "comments" ("user_id");
