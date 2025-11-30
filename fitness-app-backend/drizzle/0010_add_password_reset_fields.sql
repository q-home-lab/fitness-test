ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "reset_password_token" varchar(255);

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "reset_password_expires" timestamp;


