// Script para añadir campos de perfil (gender, age, height) a la tabla users
// Úsalo cuando la BD ya existe y las migraciones de Drizzle dan conflicto

require('dotenv').config();

const { Pool } = require('pg');

async function run() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL no está definido en el .env');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        max: 1,
    });

    console.log('🔄 Ejecutando migración manual de campos de perfil de usuario (gender, age, height)...');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Asegurar que estamos en el esquema público
        await client.query('SET search_path TO public, "$user"');

        // Añadir columnas solo si no existen
        await client.query(`
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS gender varchar(20);
        `);

        await client.query(`
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS age integer;
        `);

        await client.query(`
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS height numeric;
        `);

        console.log('✅ Campos gender, age, height verificados/añadidos correctamente en tabla users.');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error ejecutando la migración manual de usuario:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        console.log('🔚 Conexión cerrada.');
    }
}

run();


