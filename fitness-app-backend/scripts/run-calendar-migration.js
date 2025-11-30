// Script para ejecutar la migración de scheduled_routines
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL no está definido en el archivo .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    max: 1
});

async function runMigration() {
    console.log('🔄 Ejecutando migración para añadir scheduled_routines...');
    
    try {
        const migrationPath = path.join(__dirname, '../drizzle/0008_add_scheduled_routines.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await pool.query(migrationSQL);
        
        console.log('✅ Migración ejecutada exitosamente!');
        console.log('   - Tabla scheduled_routines creada');
        console.log('   - Índices creados para optimizar consultas');
        
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  La migración ya fue aplicada anteriormente (tabla scheduled_routines ya existe)');
        } else {
            console.error('❌ Error al ejecutar migración:', error.message);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

runMigration();

