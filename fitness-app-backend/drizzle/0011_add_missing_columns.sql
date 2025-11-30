-- Añadir columnas faltantes a la tabla users si no existen
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "reset_password_token" varchar(255);

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "reset_password_expires" timestamp;

-- Crear tabla user_daily_meal_plans si no existe
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

-- Añadir foreign key si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_daily_meal_plans_user_id_users_user_id_fk'
    ) THEN
        ALTER TABLE "user_daily_meal_plans" 
        ADD CONSTRAINT "user_daily_meal_plans_user_id_users_user_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;

