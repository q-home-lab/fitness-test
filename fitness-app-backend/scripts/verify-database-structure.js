// Script para verificar la estructura completa de la base de datos
require('dotenv').config();
const { Pool } = require('pg');

async function verifyDatabaseStructure() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        console.log('🔍 Verificando estructura de la base de datos...\n');
        
        // Verificar todas las tablas y sus columnas principales
        const tables = [
            'users', 'daily_logs', 'foods', 'meal_items', 'exercises',
            'daily_exercises', 'routines', 'routine_exercises', 'user_goals',
            'scheduled_routines', 'notifications', 'user_achievements',
            'achievements', 'user_daily_meal_plans', 'brand_settings'
        ];
        
        console.log('📊 Verificando tablas y columnas principales:\n');
        
        for (const tableName of tables) {
            try {
                const columns = await pool.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);
                
                if (columns.rows.length > 0) {
                    console.log(`✅ ${tableName} (${columns.rows.length} columnas)`);
                    
                    // Mostrar columnas principales
                    const mainColumns = columns.rows.slice(0, 5).map(c => c.column_name).join(', ');
                    if (columns.rows.length > 5) {
                        console.log(`   Columnas: ${mainColumns}, ... (+${columns.rows.length - 5} más)`);
                    } else {
                        console.log(`   Columnas: ${mainColumns}`);
                    }
                } else {
                    console.log(`❌ ${tableName} - NO ENCONTRADA`);
                }
            } catch (error) {
                console.log(`⚠️  ${tableName} - Error al verificar: ${error.message}`);
            }
        }
        
        // Verificar constraints importantes
        console.log('\n🔗 Verificando constraints y relaciones:\n');
        
        const foreignKeys = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name, kcu.column_name
        `);
        
        console.log(`✅ Foreign keys encontrados: ${foreignKeys.rows.length}`);
        if (foreignKeys.rows.length > 0) {
            console.log('\nAlgunas relaciones importantes:');
            foreignKeys.rows.slice(0, 10).forEach(fk => {
                console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
            });
            if (foreignKeys.rows.length > 10) {
                console.log(`   ... (+${foreignKeys.rows.length - 10} más)`);
            }
        }
        
        // Verificar índices
        console.log('\n📑 Verificando índices:\n');
        const indexes = await pool.query(`
            SELECT
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);
        
        console.log(`✅ Índices encontrados: ${indexes.rows.length}`);
        
        // Verificar datos
        console.log('\n📊 Resumen de datos:\n');
        
        const dataChecks = [
            { name: 'Usuarios', query: 'SELECT COUNT(*) as count FROM users' },
            { name: 'Ejercicios públicos', query: 'SELECT COUNT(*) as count FROM exercises WHERE is_public = true' },
            { name: 'Ejercicios con imágenes', query: 'SELECT COUNT(*) as count FROM exercises WHERE is_public = true AND (gif_url IS NOT NULL OR video_url IS NOT NULL)' },
            { name: 'Alimentos', query: 'SELECT COUNT(*) as count FROM foods' },
            { name: 'Rutinas', query: 'SELECT COUNT(*) as count FROM routines' },
            { name: 'Logs diarios', query: 'SELECT COUNT(*) as count FROM daily_logs' }
        ];
        
        for (const check of dataChecks) {
            try {
                const result = await pool.query(check.query);
                console.log(`   ${check.name}: ${result.rows[0].count}`);
            } catch (error) {
                console.log(`   ${check.name}: Error - ${error.message}`);
            }
        }
        
        console.log('\n✅ Verificación completada!');
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

verifyDatabaseStructure();

