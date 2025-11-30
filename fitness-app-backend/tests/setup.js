// Setup file for tests
// Intentar cargar .env.test primero, luego .env como fallback
require('dotenv').config({ path: '.env.test' });
require('dotenv').config(); // Cargar .env también por si no existe .env.test

// Set test environment variables if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.NODE_ENV = 'test';

// Si DATABASE_URL no está configurado, usar una URL por defecto (solo para tests)
// NOTA: Esto requerirá que el usuario configure su base de datos real
if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL no está configurado. Los tests pueden fallar si la base de datos no está disponible.');
    console.warn('⚠️  Configura DATABASE_URL en .env o .env.test para ejecutar los tests.');
}

