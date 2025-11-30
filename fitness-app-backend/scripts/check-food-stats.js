/**
 * Script para verificar estadísticas de alimentos en la base de datos
 */

require('dotenv').config();
const { db } = require('../db/db_config');
const { foods } = require('../db/schema');
const { sql } = require('drizzle-orm');

(async () => {
    try {
        const total = await db.select({ count: sql`count(*)` }).from(foods);
        
        console.log('📊 Estadísticas de la base de datos de alimentos:');
        console.log('   Total de alimentos:', total[0].count);
        console.log('\n💡 Base de datos lista para usar!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
})();

