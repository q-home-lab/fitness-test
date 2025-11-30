-- Migration: Add brand_settings table for customizable branding
-- This allows admins to customize the brand name, tagline, logo, and social media links

CREATE TABLE IF NOT EXISTS "brand_settings" (
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

