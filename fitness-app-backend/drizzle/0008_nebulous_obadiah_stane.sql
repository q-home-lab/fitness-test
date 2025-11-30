CREATE TABLE "brand_settings" (
	"setting_id" serial PRIMARY KEY NOT NULL,
	"brand_name" varchar(100) DEFAULT 'FitnessApp' NOT NULL,
	"tagline" varchar(255),
	"logo_url" varchar(500),
	"instagram_url" varchar(255),
	"facebook_url" varchar(255),
	"twitter_url" varchar(255),
	"linkedin_url" varchar(255),
	"youtube_url" varchar(255),
	"tiktok_url" varchar(255),
	"website_url" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "height" numeric;