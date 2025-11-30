// Script para verificar los ejercicios en la base de datos
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { sql, eq } = require('drizzle-orm');

async function verifyExercises() {
    console.log('🔍 Verificando ejercicios en la base de datos...\n');
    
    try {
        // Total de ejercicios
        const total = await db.select({
            count: sql`count(*)`.as('count')
        }).from(exercises).where(eq(exercises.is_public, true));
        
        console.log(`📊 Total de ejercicios públicos: ${total[0].count}\n`);
        
        // Ejercicios por categoría
        const byCategory = await db.select({
            count: sql`count(*)`.as('count'),
            category: exercises.category
        })
        .from(exercises)
        .where(eq(exercises.is_public, true))
        .groupBy(exercises.category)
        .orderBy(exercises.category);
        
        console.log('📋 Ejercicios por categoría:');
        byCategory.forEach(r => {
            console.log(`   ${r.category}: ${r.count}`);
        });
        
        // Ejercicios con imágenes
        const withImages = await db.select({
            count: sql`count(*)`.as('count')
        })
        .from(exercises)
        .where(sql`is_public = true AND (gif_url IS NOT NULL OR video_url IS NOT NULL)`);
        
        console.log(`\n🖼️  Ejercicios con imágenes: ${withImages[0].count}`);
        console.log(`   Porcentaje: ${((withImages[0].count / total[0].count) * 100).toFixed(1)}%\n`);
        
        // Ejemplos de ejercicios
        const samples = await db.select()
            .from(exercises)
            .where(eq(exercises.is_public, true))
            .limit(10)
            .orderBy(sql`random()`);
        
        console.log('📝 Ejemplos de ejercicios:');
        samples.forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.name}`);
            console.log(`      Categoría: ${e.category}`);
            console.log(`      Calorías/min: ${e.default_calories_per_minute}`);
            console.log(`      Imagen: ${e.gif_url ? '✅ Sí' : '❌ No'}`);
            if (e.gif_url) {
                console.log(`      URL: ${e.gif_url.substring(0, 80)}...`);
            }
            console.log('');
        });
        
        // Verificar grupos musculares
        console.log('💪 Verificando grupos musculares...\n');
        const muscleGroups = {
            'pecho': ['chest', 'pectoral', 'press banca', 'press pecho'],
            'pierna': ['squat', 'leg', 'sentadilla', 'prensa'],
            'espalda': ['back', 'remo', 'pull', 'dominada'],
            'brazos': ['curl', 'bicep', 'tricep', 'arm'],
            'hombros': ['shoulder', 'press militar', 'elevación']
        };
        
        for (const [group, keywords] of Object.entries(muscleGroups)) {
            const conditions = keywords.map(kw => sql`name ILIKE ${'%' + kw + '%'}`);
            const result = await db.select({
                count: sql`count(*)`.as('count')
            })
            .from(exercises)
            .where(sql`is_public = true AND (${sql.join(conditions, sql` OR `)})`);
            
            console.log(`   ${group}: ${result[0].count} ejercicios`);
        }
        
        console.log('\n✅ Verificación completada!');
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifyExercises();

