CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"date" date NOT NULL,
	"weight" numeric NOT NULL,
	"consumed_calories" numeric DEFAULT 0 NOT NULL,
	"burned_calories" numeric DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_date_idx" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"routine_id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"category_id" serial NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"exercise_id" serial PRIMARY KEY NOT NULL,
	"category_id" serial NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"is_cardio" boolean DEFAULT false NOT NULL,
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "routine_exercises" (
	"routine_exercise_id" serial PRIMARY KEY NOT NULL,
	"routine_id" serial NOT NULL,
	"exercise_id" serial NOT NULL,
	"sets_prescribed" integer NOT NULL,
	"reps_prescribed" integer,
	"order_in_routine" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"log_id" serial NOT NULL,
	"routine_id" serial NOT NULL,
	"duration_minutes" integer,
	"total_calories_burnt" numeric DEFAULT 0,
	"notes" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_performance" (
	"performance_id" serial PRIMARY KEY NOT NULL,
	"session_id" serial NOT NULL,
	"exercise_id" serial NOT NULL,
	"set_number" integer,
	"reps_performed" integer,
	"weight_lifted" numeric,
	"duration_minutes" integer,
	"distance_km" numeric,
	"calories_burnt" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"food_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"calories_base" numeric NOT NULL,
	"protein_g" numeric DEFAULT 0 NOT NULL,
	"carbs_g" numeric DEFAULT 0 NOT NULL,
	"fat_g" numeric DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "foods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meal_items" (
	"meal_item_id" serial PRIMARY KEY NOT NULL,
	"log_id" serial NOT NULL,
	"food_id" serial NOT NULL,
	"quantity_grams" numeric NOT NULL,
	"meal_type" varchar(50) NOT NULL,
	"consumed_calories" numeric NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("routine_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_log_id_daily_logs_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."daily_logs"("log_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("routine_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_session_id_workout_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_performance" ADD CONSTRAINT "exercise_performance_exercise_id_exercises_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_log_id_daily_logs_log_id_fk" FOREIGN KEY ("log_id") REFERENCES "public"."daily_logs"("log_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_foods_food_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("food_id") ON DELETE no action ON UPDATE no action;