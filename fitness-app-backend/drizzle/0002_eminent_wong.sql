ALTER TABLE "daily_logs" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "meal_items" ALTER COLUMN "log_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "meal_items" ALTER COLUMN "food_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "routines" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "routine_exercises" ALTER COLUMN "routine_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "routine_exercises" ALTER COLUMN "exercise_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "daily_exercises" ALTER COLUMN "log_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "daily_exercises" ALTER COLUMN "exercise_id" SET DATA TYPE integer;