/**
 * Script para agregar índices a la base de datos
 * Mejora el rendimiento de consultas frecuentes
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    logger.error('DATABASE_URL no está definido en el archivo .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: connectionString,
    max: 1, // Solo una conexión para migraciones
});

async function addIndexes() {
    const client = await pool.connect();
    
    try {
        logger.info('Iniciando agregado de índices...');
        
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '../db/migrations/add-indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Ejecutar el SQL
        await client.query(sql);
        
        logger.info('✅ Índices agregados exitosamente');
        
    } catch (error) {
        logger.error('Error al agregar índices:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    addIndexes()
        .then(() => {
            logger.info('Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { addIndexes };

