-- Author page: WHERE author_id = N AND status='published'
CREATE INDEX IF NOT EXISTS "posts_author_idx" ON "posts" ("author_id", "published_at" DESC NULLS LAST);

-- Trending widget: top viewed posts per locale recently
CREATE INDEX IF NOT EXISTS "posts_trending_idx" ON "posts" ("locale", "status", "view_count" DESC NULLS LAST);

-- Tag listing: top posts for a tag (already covered by post_tags pkey but
-- when joining to posts we sort by published_at)
CREATE INDEX IF NOT EXISTS "post_tags_tag_idx2" ON "post_tags" ("tag_id");

-- Newsletter active subscribers per locale (used by sendWeeklyDigest)
CREATE INDEX IF NOT EXISTS "newsletter_active_idx" ON "newsletter_subscribers" ("locale")
  WHERE "unsubscribed_at" IS NULL;

-- Push active subscribers per locale (used by broadcastPush)
CREATE INDEX IF NOT EXISTS "push_active_idx" ON "push_subscriptions" ("locale")
  WHERE "invalidated_at" IS NULL;

-- Live entries timeline for a fixture (already exists as live_entries_fixture_idx
-- but it's (fixture_id, occurred_at). Drop into stats so PG re-plans.
ANALYZE posts;
ANALYZE comments;
ANALYZE post_tags;
ANALYZE push_subscriptions;
ANALYZE newsletter_subscribers;
