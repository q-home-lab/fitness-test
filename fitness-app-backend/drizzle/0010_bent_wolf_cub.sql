CREATE TABLE "invite_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invite_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(20) DEFAULT 'CLIENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "coach_id" integer;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_coach_id_users_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_coach_id_users_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;