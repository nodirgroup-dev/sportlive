ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "featured_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "posts_featured_idx" ON "posts" ("locale", "featured_at");
