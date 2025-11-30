// Script para ejecutar la migración de onboarding
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
    console.log('🔄 Ejecutando migración para añadir campos de onboarding...');
    
    try {
        const migrationPath = path.join(__dirname, '../drizzle/0009_add_onboarding_fields.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        await pool.query(migrationSQL);
        
        console.log('✅ Migración ejecutada exitosamente!');
        console.log('   - Campos onboarding_completed y onboarding_step añadidos a users');
        
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  La migración ya fue aplicada anteriormente');
        } else {
            console.error('❌ Error al ejecutar migración:', error.message);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

runMigration();

