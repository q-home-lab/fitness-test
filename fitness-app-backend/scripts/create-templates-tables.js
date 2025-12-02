// Script para crear las tablas de plantillas manualmente
require('dotenv').config();
const { Pool } = require('pg');

async function createTemplatesTables() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('🔧 Creando tablas de plantillas...\n');

        // Verificar si las tablas ya existen
        const checkRoutineTemplates = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'routine_templates'
            );
        `);

        const checkDietTemplates = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'diet_templates'
            );
        `);

        if (checkRoutineTemplates.rows[0].exists) {
            console.log('⚠️  La tabla routine_templates ya existe. Saltando...');
        } else {
            console.log('📝 Creando tabla routine_templates...');
            await pool.query(`
                CREATE TABLE "routine_templates" (
                    "template_id" serial PRIMARY KEY NOT NULL,
                    "coach_id" integer NOT NULL,
                    "name" varchar(100) NOT NULL,
                    "description" varchar(500),
                    "exercises" jsonb NOT NULL,
                    "created_at" timestamp DEFAULT now(),
                    "updated_at" timestamp DEFAULT now()
                );
            `);
            console.log('✅ Tabla routine_templates creada exitosamente.');
        }

        if (checkDietTemplates.rows[0].exists) {
            console.log('⚠️  La tabla diet_templates ya existe. Saltando...');
        } else {
            console.log('📝 Creando tabla diet_templates...');
            await pool.query(`
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
            `);
            console.log('✅ Tabla diet_templates creada exitosamente.');
        }

        // Crear foreign keys si no existen
        console.log('\n🔗 Creando foreign keys...');
        
        try {
            await pool.query(`
                ALTER TABLE "routine_templates" 
                ADD CONSTRAINT "routine_templates_coach_id_users_user_id_fk" 
                FOREIGN KEY ("coach_id") 
                REFERENCES "public"."users"("user_id") 
                ON DELETE no action 
                ON UPDATE no action;
            `);
            console.log('✅ Foreign key para routine_templates.coach_id creada.');
        } catch (error) {
            if (error.code === '42710' || error.message.includes('ya existe')) {
                console.log('⚠️  Foreign key routine_templates_coach_id_users_user_id_fk ya existe.');
            } else {
                throw error;
            }
        }

        try {
            await pool.query(`
                ALTER TABLE "diet_templates" 
                ADD CONSTRAINT "diet_templates_coach_id_users_user_id_fk" 
                FOREIGN KEY ("coach_id") 
                REFERENCES "public"."users"("user_id") 
                ON DELETE no action 
                ON UPDATE no action;
            `);
            console.log('✅ Foreign key para diet_templates.coach_id creada.');
        } catch (error) {
            if (error.code === '42710' || error.message.includes('ya existe')) {
                console.log('⚠️  Foreign key diet_templates_coach_id_users_user_id_fk ya existe.');
            } else {
                throw error;
            }
        }

        // Crear tabla client_routine_assignments si no existe
        const checkAssignments = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'client_routine_assignments'
            );
        `);

        if (checkAssignments.rows[0].exists) {
            console.log('⚠️  La tabla client_routine_assignments ya existe. Saltando...');
        } else {
            console.log('📝 Creando tabla client_routine_assignments...');
            await pool.query(`
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
            `);
            console.log('✅ Tabla client_routine_assignments creada exitosamente.');

            // Crear foreign keys para client_routine_assignments
            try {
                await pool.query(`
                    ALTER TABLE "client_routine_assignments" 
                    ADD CONSTRAINT "client_routine_assignments_client_id_users_user_id_fk" 
                    FOREIGN KEY ("client_id") 
                    REFERENCES "public"."users"("user_id") 
                    ON DELETE no action 
                    ON UPDATE no action;
                `);
                console.log('✅ Foreign key para client_routine_assignments.client_id creada.');
            } catch (error) {
                if (error.code === '42710' || error.message.includes('ya existe')) {
                    console.log('⚠️  Foreign key client_routine_assignments_client_id_users_user_id_fk ya existe.');
                } else {
                    throw error;
                }
            }

            try {
                await pool.query(`
                    ALTER TABLE "client_routine_assignments" 
                    ADD CONSTRAINT "client_routine_assignments_template_id_routine_templates_template_id_fk" 
                    FOREIGN KEY ("template_id") 
                    REFERENCES "public"."routine_templates"("template_id") 
                    ON DELETE no action 
                    ON UPDATE no action;
                `);
                console.log('✅ Foreign key para client_routine_assignments.template_id creada.');
            } catch (error) {
                if (error.code === '42710' || error.message.includes('ya existe')) {
                    console.log('⚠️  Foreign key client_routine_assignments_template_id_routine_templates_template_id_fk ya existe.');
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ ¡Todas las tablas de plantillas han sido creadas exitosamente!');
    } catch (error) {
        console.error('❌ Error creando las tablas:', error);
        if (error.cause) {
            console.error('   Código:', error.cause.code);
            console.error('   Mensaje:', error.cause.message);
        }
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\nConexión cerrada.');
    }
}

createTemplatesTables();

