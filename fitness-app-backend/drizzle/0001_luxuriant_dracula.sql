CREATE TABLE "daily_exercises" (
	"daily_exercise_id" serial PRIMARY KEY NOT NULL,
	"log_id" serial NOT NULL,
	"exercise_id" serial NOT NULL,
	"sets_done" integer NOT NULL,
	"reps_done" integer,
	"duration_minutes" numeric,
	"weight_kg" numeric DEFAULT 0,
	"burned_calories" numeric NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "workout_sessions" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "exercise_performance" DISABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP TABLE "categories" CASCADE;
--> statement-breakpoint
DROP TABLE "workout_sessions" CASCADE;
--> statement-breakpoint
DROP TABLE "exercise_performance" CASCADE;
--> statement-breakpoint
ALTER TABLE "daily_logs" DROP CONSTRAINT "user_date_idx";
--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "category" varchar(50) NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "default_calories_per_minute" numeric DEFAULT 5 NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "created_at" timestamp DEFAULT now();
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN "sets" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN "reps" integer;
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN "duration_minutes" numeric;
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN "weight_kg" numeric DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD COLUMN "order_index" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_log_id_daily_logs_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."daily_logs"("log_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "daily_exercises" ADD CONSTRAINT "daily_exercises_exercise_id_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("exercise_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "routines" DROP COLUMN "category_id";
--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "category_id";
--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "description";
--> statement-breakpoint
ALTER TABLE "exercises" DROP COLUMN "is_cardio";
--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP COLUMN "sets_prescribed";
--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP COLUMN "reps_prescribed";
--> statement-breakpoint
ALTER TABLE "routine_exercises" DROP COLUMN "order_in_routine";
--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_log_unique" UNIQUE("user_id","date");
--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercise_unique" UNIQUE("routine_id","exercise_id");