// Carga las variables de entorno
require('dotenv').config();

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema'); // Importamos el esquema para la instancia de Drizzle
const logger = require('../utils/logger');

// 1. Configuración de la Conexión
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en el archivo .env');
}

// 2. Crear el pool de conexión con configuración avanzada
const pool = new Pool({
    connectionString: connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Máximo de conexiones
    min: parseInt(process.env.DB_POOL_MIN || '5', 10), // Mínimo de conexiones a mantener
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30s - cerrar conexiones inactivas
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10), // 2s - timeout de conexión
    allowExitOnIdle: false, // No cerrar pool cuando no hay conexiones activas
});

// Event handlers para monitoreo del pool
pool.on('connect', (client) => {
    logger.debug('Nueva conexión a la base de datos establecida');
});

pool.on('error', (err, client) => {
    logger.error('Error inesperado en el pool de conexiones:', {
        error: err.message,
        stack: err.stack,
    });
});

pool.on('acquire', (client) => {
    logger.debug('Conexión adquirida del pool');
});

pool.on('remove', (client) => {
    logger.debug('Conexión removida del pool');
});

// 3. Crear la instancia de Drizzle
// PASO CRÍTICO: Vinculamos el pool con el esquema (schema)
const db = drizzle(pool, { schema: schema });

/**
 * Verifica la salud de la base de datos
 * @returns {Promise<Object>} Estado de salud de la base de datos
 */
async function checkDatabaseHealth() {
    try {
        const result = await pool.query('SELECT NOW() as current_time, version() as version');
        return {
            healthy: true,
            timestamp: result.rows[0].current_time,
            version: result.rows[0].version,
            poolStats: {
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
                waitingCount: pool.waitingCount,
            },
        };
    } catch (error) {
        logger.error('Error en health check de base de datos:', error);
        return {
            healthy: false,
            error: error.message,
        };
    }
}

// 4. Exportación
module.exports = {
    db,
    pool,
    checkDatabaseHealth,
};