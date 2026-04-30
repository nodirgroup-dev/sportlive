CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "actor_id" integer,
  "actor_label" varchar(200),
  "action" varchar(64) NOT NULL,
  "entity_type" varchar(32),
  "entity_id" integer,
  "summary" varchar(500),
  "meta" jsonb,
  "ip" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_fk"
    FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "audit_log_created_idx" ON "audit_log" ("created_at");
CREATE INDEX IF NOT EXISTS "audit_log_actor_idx" ON "audit_log" ("actor_id");
CREATE INDEX IF NOT EXISTS "audit_log_entity_idx" ON "audit_log" ("entity_type", "entity_id");
