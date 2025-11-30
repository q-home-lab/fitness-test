// Script para verificar si las columnas necesarias existen en la base de datos
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

async function checkColumns() {
    try {
        console.log('🔍 Verificando columnas de la tabla users...\n');
        
        // Verificar si la tabla users existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.error('❌ La tabla users no existe');
            await pool.end();
            process.exit(1);
        }
        
        console.log('✅ La tabla users existe\n');
        
        // Obtener todas las columnas de la tabla users
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'users'
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Columnas encontradas:');
        result.rows.forEach(row => {
            console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });
        
        // Verificar columnas específicas
        const columnNames = result.rows.map(r => r.column_name);
        const requiredColumns = ['user_id', 'email', 'password_hash', 'role', 'coach_id'];
        
        console.log('\n🔍 Verificando columnas requeridas:');
        requiredColumns.forEach(col => {
            if (columnNames.includes(col)) {
                console.log(`   ✅ ${col} existe`);
            } else {
                console.log(`   ❌ ${col} NO existe`);
            }
        });
        
        // Verificar si role tiene el valor por defecto
        const roleColumn = result.rows.find(r => r.column_name === 'role');
        if (roleColumn) {
            console.log(`\n📝 Columna role: ${roleColumn.column_default || 'sin valor por defecto'}`);
        }
        
    } catch (error) {
        console.error('❌ Error al verificar columnas:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

checkColumns();

