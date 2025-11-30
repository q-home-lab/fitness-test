require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1
});

async function verifyTable() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'brand_settings' 
            ORDER BY ordinal_position
        `);
        
        if (result.rows.length === 0) {
            console.log('❌ La tabla brand_settings no existe');
        } else {
            console.log('✅ Tabla brand_settings existe con columnas:');
            result.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

verifyTable();

