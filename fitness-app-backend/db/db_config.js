// Carga las variables de entorno
require('dotenv').config();

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema'); // Importamos el esquema para la instancia de Drizzle

// 1. Configuración de la Conexión
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en el archivo .env');
}

// 2. Crear el pool de conexión
const pool = new Pool({
    connectionString: connectionString,
    max: 20 // Aumentamos la conexión máxima para el servidor Express
});

// 3. Crear la instancia de Drizzle
// PASO CRÍTICO: Vinculamos el pool con el esquema (schema)
const db = drizzle(pool, { schema: schema });

// 4. Exportación
module.exports = {
    db
};