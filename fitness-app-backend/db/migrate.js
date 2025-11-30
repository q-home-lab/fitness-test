// Carga las variables de entorno
require('dotenv').config();

const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

// 1. Configuración de la Conexión
const connectionString = process.env.DATABASE_URL;

console.log('Valor de DATABASE_URL leído:', connectionString ? 'Sí está definido' : '¡Error! No está definido');

if (!connectionString) {
    throw new Error('DATABASE_URL no está definido en el archivo .env');
}

// 2. Crear la instancia de Drizzle (sin el esquema, solo para migrar)
const pool = new Pool({
    connectionString: connectionString,
    max: 1 // Usamos una conexión mínima para la migración
});

// 🛠️ CORRECCIÓN CRUCIAL: Forzar el uso del esquema 'public' para la migración.
pool.on('connect', (client) => {
    client.query('SET search_path TO public, "$user"');
});

const db = drizzle(pool);

// 3. Función principal para ejecutar la migración
async function runMigrations() {
    console.log("🚀 Iniciando migraciones...");
    try {
        // Ejecuta la migración. Busca el código SQL generado en la carpeta './drizzle'
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("✅ Migraciones completadas exitosamente.");
    } catch (error) {
        // Manejar errores específicos de tablas/columnas/constraints ya existentes
        const errorCode = error.cause?.code;
        const errorMessage = error.cause?.message || error.message;
        
        if (errorCode === '42P07') {
            // Error: relación (tabla) ya existe
            console.warn("⚠️  Advertencia: La tabla ya existe. Esto puede ser normal si la migración ya se ejecutó anteriormente.");
            console.warn("   Código de error:", errorCode);
            console.warn("   Mensaje:", errorMessage);
            console.log("ℹ️  Continuando... La migración puede haber sido aplicada parcialmente.");
        } else if (errorCode === '42701') {
            // Error: columna duplicada
            console.warn("⚠️  Advertencia: La columna ya existe. Esto puede ser normal si la migración ya se ejecutó anteriormente.");
            console.warn("   Código de error:", errorCode);
            console.warn("   Mensaje:", errorMessage);
            console.log("ℹ️  Continuando... La migración puede haber sido aplicada parcialmente.");
        } else if (errorCode === '42710' || errorCode === '42P16') {
            // Error: objeto duplicado (constraint, index, etc.)
            console.warn("⚠️  Advertencia: El constraint/índice ya existe. Esto puede ser normal si la migración ya se ejecutó anteriormente.");
            console.warn("   Código de error:", errorCode);
            console.warn("   Mensaje:", errorMessage);
            console.log("ℹ️  Continuando... La migración puede haber sido aplicada parcialmente.");
        } else if (errorMessage && (errorMessage.includes('already exists') || errorMessage.includes('ya existe'))) {
            // Error genérico de objeto ya existente
            console.warn("⚠️  Advertencia: El objeto ya existe. Esto puede ser normal si la migración ya se ejecutó anteriormente.");
            console.warn("   Mensaje:", errorMessage);
            console.log("ℹ️  Continuando... La migración puede haber sido aplicada parcialmente.");
        } else {
            console.error("❌ Falló la migración:", error);
            if (error.cause) {
                console.error("   Código de error:", error.cause.code);
                console.error("   Mensaje:", error.cause.message);
            }
            process.exit(1);
        }
    } finally {
        // Cierra la conexión después de terminar
        await pool.end(); 
        console.log("Conexión cerrada.");
    }
}

runMigrations();