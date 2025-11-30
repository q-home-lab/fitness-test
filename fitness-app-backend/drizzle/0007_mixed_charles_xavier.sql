CREATE TABLE IF NOT EXISTS "scheduled_routines" (
	"scheduled_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"routine_id" integer NOT NULL,
	"scheduled_date" date NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "scheduled_routine_unique" UNIQUE("user_id","routine_id","scheduled_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_daily_meal_plans" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"breakfast" varchar(1000),
	"lunch" varchar(1000),
	"dinner" varchar(1000),
	"snacks" varchar(1000),
	CONSTRAINT "user_day_unique" UNIQUE("user_id","day_of_week")
);
--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP CONSTRAINT "routine_exercise_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN IF NOT EXISTS "day_of_week" integer;--> statement-breakpoint
ALTER TABLE "scheduled_routines" ADD CONSTRAINT "scheduled_routines_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_routines" ADD CONSTRAINT "scheduled_routines_routine_id_routines_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("routine_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_meal_plans" ADD CONSTRAINT "user_daily_meal_plans_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercise_unique" UNIQUE("routine_id","exercise_id","day_of_week");