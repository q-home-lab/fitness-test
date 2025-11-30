// Script para verificar ejercicios de wger y ejercicios sin imagen
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { isNotNull, isNull, and, or, eq } = require('drizzle-orm');

async function checkWgerAndImages() {
    try {
        console.log('🔍 Verificando ejercicios de wger y ejercicios sin imagen...\n');
        
        // 1. Verificar ejercicios de wger
        const wgerExercises = await db.select()
            .from(exercises)
            .where(isNotNull(exercises.wger_id));
        
        console.log(`📊 EJERCICIOS DE WGER:`);
        console.log(`   Total encontrados: ${wgerExercises.length}`);
        
        if (wgerExercises.length > 0) {
            console.log('\n   Lista de ejercicios de wger:');
            wgerExercises.forEach(ex => {
                console.log(`   - ${ex.name} (ID: ${ex.exercise_id}, wger_id: ${ex.wger_id})`);
            });
        } else {
            console.log('   ✅ No hay ejercicios de wger en la base de datos\n');
        }
        
        // 2. Verificar ejercicios sin imagen
        const exercisesWithoutImage = await db.select()
            .from(exercises)
            .where(
                and(
                    eq(exercises.is_public, true),
                    or(
                        isNull(exercises.gif_url),
                        isNull(exercises.video_url)
                    )
                )
            );
        
        // Filtrar los que realmente no tienen ninguna imagen
        const noImageAtAll = exercisesWithoutImage.filter(ex => 
            (!ex.gif_url || ex.gif_url.trim().length === 0) && 
            (!ex.video_url || ex.video_url.trim().length === 0)
        );
        
        console.log(`\n📊 EJERCICIOS SIN IMAGEN:`);
        console.log(`   Total sin imagen ni video: ${noImageAtAll.length}`);
        
        if (noImageAtAll.length > 0) {
            console.log('\n   Lista de ejercicios sin imagen:');
            noImageAtAll.forEach(ex => {
                console.log(`   - ${ex.name} (ID: ${ex.exercise_id})`);
                if (ex.wger_id) {
                    console.log(`     ⚠️  Tiene wger_id: ${ex.wger_id}`);
                }
            });
        } else {
            console.log('   ✅ Todos los ejercicios tienen al menos una imagen o video\n');
        }
        
        // 3. Estadísticas generales
        const allExercises = await db.select().from(exercises);
        const withImage = allExercises.filter(ex => 
            ex.gif_url && ex.gif_url.trim().length > 0
        );
        const withVideo = allExercises.filter(ex => 
            ex.video_url && ex.video_url.trim().length > 0
        );
        
        console.log(`\n📊 ESTADÍSTICAS GENERALES:`);
        console.log(`   Total de ejercicios: ${allExercises.length}`);
        console.log(`   Con imagen (gif_url): ${withImage.length}`);
        console.log(`   Con video (video_url): ${withVideo.length}`);
        console.log(`   Sin imagen ni video: ${noImageAtAll.length}`);
        console.log(`   Con wger_id: ${wgerExercises.length}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

checkWgerAndImages()
    .then(() => {
        console.log('✅ Verificación completada.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

