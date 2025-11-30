// Script para agregar las columnas role y coach_id a la tabla users
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL no está definido en el archivo .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
});

async function addColumns() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('🔍 Verificando si las columnas ya existen...');
        
        // Verificar si role existe
        const roleCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'role';
        `);
        
        if (roleCheck.rows.length === 0) {
            console.log('➕ Agregando columna role...');
            await client.query(`ALTER TABLE users ADD COLUMN role varchar(20) DEFAULT 'CLIENT' NOT NULL;`);
            console.log('✅ Columna role agregada');
        } else {
            console.log('ℹ️  Columna role ya existe');
        }
        
        // Verificar si coach_id existe
        const coachIdCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'coach_id';
        `);
        
        if (coachIdCheck.rows.length === 0) {
            console.log('➕ Agregando columna coach_id...');
            await client.query(`ALTER TABLE users ADD COLUMN coach_id integer;`);
            console.log('✅ Columna coach_id agregada');
        } else {
            console.log('ℹ️  Columna coach_id ya existe');
        }
        
        // Verificar si el constraint existe
        const constraintCheck = await client.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND constraint_name = 'users_coach_id_users_user_id_fk';
        `);
        
        if (constraintCheck.rows.length === 0) {
            console.log('➕ Agregando constraint de foreign key...');
            await client.query(`
                ALTER TABLE users 
                ADD CONSTRAINT users_coach_id_users_user_id_fk 
                FOREIGN KEY (coach_id) 
                REFERENCES users(user_id) 
                ON DELETE no action 
                ON UPDATE no action;
            `);
            console.log('✅ Constraint agregado');
        } else {
            console.log('ℹ️  Constraint ya existe');
        }
        
        await client.query('COMMIT');
        console.log('\n✅ Todas las columnas y constraints están en su lugar');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al agregar columnas:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

addColumns();

