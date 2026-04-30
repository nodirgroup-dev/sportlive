CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "push_subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "endpoint" text NOT NULL,
  "p256dh" varchar(200) NOT NULL,
  "auth" varchar(100) NOT NULL,
  "locale" "locale",
  "user_agent" varchar(500),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "invalidated_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_locale_idx" ON "push_subscriptions" ("locale", "invalidated_at");

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "newsletter_subscribers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "email" varchar(320) NOT NULL,
  "locale" "locale",
  "ip" varchar(64),
  "unsubscribed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_email_idx" ON "newsletter_subscribers" ("email");
CREATE INDEX IF NOT EXISTS "newsletter_locale_idx" ON "newsletter_subscribers" ("locale", "unsubscribed_at");
