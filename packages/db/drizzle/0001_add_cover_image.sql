ALTER TABLE "posts" DROP COLUMN IF EXISTS "cover_image_id";
ALTER TABLE "posts" ADD COLUMN "cover_image" varchar(500);
ALTER TABLE "posts" ADD COLUMN "cover_image_width" integer;
ALTER TABLE "posts" ADD COLUMN "cover_image_height" integer;
