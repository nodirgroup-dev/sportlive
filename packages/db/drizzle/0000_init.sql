CREATE TYPE "public"."locale" AS ENUM('uz', 'ru', 'en');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor', 'author', 'reader');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(100) NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'reader' NOT NULL,
	"bio" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_legacyId_unique" UNIQUE("legacy_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"parent_id" integer,
	"slug" varchar(200) NOT NULL,
	"locale" "locale" NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"legacy_id" integer,
	"locale" "locale" NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"summary" text,
	"body" text NOT NULL,
	"cover_image_id" integer,
	"author_id" integer,
	"category_id" integer,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"meta_title" varchar(300),
	"meta_description" varchar(500),
	"meta_keywords" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"group_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_legacyId_unique" UNIQUE("legacy_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_tags" (
	"post_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"locale" "locale" NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"path" varchar(500) NOT NULL,
	"alt" text,
	"title" varchar(300),
	"width" integer,
	"height" integer,
	"mime_type" varchar(100),
	"size_bytes" integer,
	"uploaded_by" integer,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redirects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "redirects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"from_path" varchar(1000) NOT NULL,
	"to_path" varchar(1000) NOT NULL,
	"status_code" smallint DEFAULT 301 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_locale_idx" ON "categories" USING btree ("slug","locale");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_legacy_idx" ON "categories" USING btree ("legacy_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "posts_locale_slug_idx" ON "posts" USING btree ("locale","slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "posts_locale_group_idx" ON "posts" USING btree ("locale","group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_published_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_category_idx" ON "posts" USING btree ("category_id","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_legacy_idx" ON "posts" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_tags_tag_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tags_locale_slug_idx" ON "tags" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_legacy_idx" ON "media" USING btree ("legacy_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "redirects_from_idx" ON "redirects" USING btree ("from_path");