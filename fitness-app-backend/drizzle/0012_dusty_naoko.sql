CREATE TABLE "check_ins" (
	"check_in_id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"week_of" date NOT NULL,
	"weight" numeric,
	"feeling" integer,
	"notes" text,
	"photo_front" varchar(500),
	"photo_side" varchar(500),
	"photo_back" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "check_in_unique" UNIQUE("client_id","week_of")
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_client_id_users_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;