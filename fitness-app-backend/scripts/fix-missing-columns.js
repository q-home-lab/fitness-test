// Script para añadir columnas faltantes manualmente
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en el archivo .env');
}

const pool = new Pool({
    connectionString: connectionString,
});

async function fixMissingColumns() {
    const client = await pool.connect();
    try {
        console.log('🔧 Añadiendo columnas faltantes...');

        // Añadir columnas a users si no existen
        await client.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "reset_password_token" varchar(255);
        `);
        console.log('✅ Columna reset_password_token añadida (o ya existía)');

        await client.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "reset_password_expires" timestamp;
        `);
        console.log('✅ Columna reset_password_expires añadida (o ya existía)');

        // Crear tabla user_daily_meal_plans si no existe
        await client.query(`
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
        `);
        console.log('✅ Tabla user_daily_meal_plans creada (o ya existía)');

        // Añadir foreign key si no existe
        const fkCheck = await client.query(`
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_daily_meal_plans_user_id_users_user_id_fk'
        `);

        if (fkCheck.rows.length === 0) {
            await client.query(`
                ALTER TABLE "user_daily_meal_plans" 
                ADD CONSTRAINT "user_daily_meal_plans_user_id_users_user_id_fk" 
                FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
            `);
            console.log('✅ Foreign key añadida');
        } else {
            console.log('✅ Foreign key ya existía');
        }

        console.log('✅ Todas las columnas y tablas están correctas');
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixMissingColumns()
    .then(() => {
        console.log('🎉 Proceso completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

