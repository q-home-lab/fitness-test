CREATE TABLE "routine_templates" (
	"template_id" serial PRIMARY KEY NOT NULL,
	"coach_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"exercises" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diet_templates" (
	"template_id" serial PRIMARY KEY NOT NULL,
	"coach_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"meals" jsonb NOT NULL,
	"target_macros" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_routine_assignments" (
	"assignment_id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"template_id" integer NOT NULL,
	"assigned_date" date NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_day" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "assignment_unique" UNIQUE("client_id","template_id","assigned_date")
);
--> statement-breakpoint
ALTER TABLE "routine_templates" ADD CONSTRAINT "routine_templates_coach_id_users_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_templates" ADD CONSTRAINT "diet_templates_coach_id_users_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_routine_assignments" ADD CONSTRAINT "client_routine_assignments_client_id_users_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_routine_assignments" ADD CONSTRAINT "client_routine_assignments_template_id_routine_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."routine_templates"("template_id") ON DELETE no action ON UPDATE no action;