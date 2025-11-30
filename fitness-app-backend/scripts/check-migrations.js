// Script para verificar el estado de las migraciones
require('dotenv').config();
const { Pool } = require('pg');

async function checkMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        console.log('🔍 Verificando estado de la base de datos...\n');
        
        // Verificar si existe la tabla de migraciones
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '__drizzle_migrations'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ Tabla de migraciones existe\n');
            
            // Obtener migraciones aplicadas
            const migrations = await pool.query(`
                SELECT hash, created_at 
                FROM __drizzle_migrations 
                ORDER BY created_at DESC
            `);
            
            console.log(`📋 Migraciones aplicadas: ${migrations.rows.length}\n`);
            if (migrations.rows.length > 0) {
                console.log('Últimas 10 migraciones:');
                migrations.rows.slice(0, 10).forEach((r, i) => {
                    console.log(`   ${i + 1}. ${r.hash.substring(0, 20)}... - ${r.created_at}`);
                });
            }
        } else {
            console.log('⚠️  Tabla de migraciones no existe - se creará al ejecutar la primera migración\n');
        }
        
        // Verificar tablas principales
        console.log('\n📊 Verificando tablas principales...\n');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log(`✅ Tablas encontradas: ${tables.rows.length}`);
        tables.rows.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.table_name}`);
        });
        
        // Verificar tabla de ejercicios específicamente
        console.log('\n💪 Verificando tabla de ejercicios...\n');
        const exercisesCheck = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN gif_url IS NOT NULL OR video_url IS NOT NULL THEN 1 END) as with_images
            FROM exercises
            WHERE is_public = true
        `);
        
        if (exercisesCheck.rows.length > 0) {
            const stats = exercisesCheck.rows[0];
            console.log(`   Total de ejercicios públicos: ${stats.total}`);
            console.log(`   Ejercicios con imágenes: ${stats.with_images}`);
            console.log(`   Porcentaje: ${((stats.with_images / stats.total) * 100).toFixed(1)}%`);
        }
        
    } catch (error) {
        console.error('❌ Error al verificar:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkMigrations();

