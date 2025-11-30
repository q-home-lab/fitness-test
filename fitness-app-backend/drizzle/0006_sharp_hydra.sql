CREATE TABLE "user_goals" (
	"goal_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_weight" numeric NOT NULL,
	"current_weight" numeric NOT NULL,
	"daily_calorie_goal" numeric,
	"weekly_weight_change_goal" numeric DEFAULT -0.5 NOT NULL,
	"goal_type" varchar(50) DEFAULT 'weight_loss' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;