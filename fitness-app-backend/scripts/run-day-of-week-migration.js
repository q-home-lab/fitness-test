// Script para ejecutar la migración de day_of_week manualmente
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
    console.log('🔄 Ejecutando migración para añadir day_of_week...');
    
    try {
        // Leer el archivo SQL de migración
        const migrationPath = path.join(__dirname, '../drizzle/0007_add_day_of_week_to_routine_exercises.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Ejecutar la migración
        await pool.query(migrationSQL);
        
        console.log('✅ Migración ejecutada exitosamente!');
        console.log('   - Campo day_of_week añadido a routine_exercises');
        console.log('   - Índice creado para optimizar consultas');
        
    } catch (error) {
        // Si el error es porque la columna ya existe, está bien
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  La migración ya fue aplicada anteriormente (campo day_of_week ya existe)');
        } else {
            console.error('❌ Error al ejecutar migración:', error.message);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

runMigration();

