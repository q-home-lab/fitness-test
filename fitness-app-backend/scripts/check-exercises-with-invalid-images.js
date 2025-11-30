// Script para verificar ejercicios con URLs de imagen vacías o inválidas
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, or, and, sql } = require('drizzle-orm');

async function checkExercisesWithInvalidImages() {
    try {
        console.log('🔍 Verificando ejercicios con URLs de imagen vacías o inválidas...\n');
        
        // Obtener todos los ejercicios públicos
        const allExercises = await db.select()
            .from(exercises)
            .where(eq(exercises.is_public, true));
        
        console.log(`📊 Total de ejercicios públicos: ${allExercises.length}\n`);
        
        // Filtrar ejercicios sin imagen válida
        const invalidImages = [];
        
        for (const exercise of allExercises) {
            const hasGif = exercise.gif_url && exercise.gif_url.trim().length > 0;
            const hasVideo = exercise.video_url && exercise.video_url.trim().length > 0;
            
            // Verificar si las URLs son válidas (no solo espacios, no "null", no "undefined")
            const gifValid = hasGif && 
                exercise.gif_url !== 'null' && 
                exercise.gif_url !== 'undefined' &&
                !exercise.gif_url.trim().startsWith('null');
            
            const videoValid = hasVideo && 
                exercise.video_url !== 'null' && 
                exercise.video_url !== 'undefined' &&
                !exercise.video_url.trim().startsWith('null');
            
            if (!gifValid && !videoValid) {
                invalidImages.push({
                    ...exercise,
                    reason: 'sin imagen ni video válidos',
                    gif_url: exercise.gif_url || '(vacío)',
                    video_url: exercise.video_url || '(vacío)'
                });
            } else if (!gifValid && videoValid) {
                // Tiene video pero no gif - esto está bien
            } else if (gifValid && !videoValid) {
                // Tiene gif pero no video - esto está bien
            }
        }
        
        console.log(`⚠️  Ejercicios sin imagen válida: ${invalidImages.length}\n`);
        
        if (invalidImages.length > 0) {
            console.log('📋 Lista de ejercicios sin imagen válida:');
            invalidImages.forEach(ex => {
                console.log(`   - "${ex.name}" (ID: ${ex.exercise_id})`);
                console.log(`     gif_url: ${ex.gif_url}`);
                console.log(`     video_url: ${ex.video_url}`);
                if (ex.wger_id) {
                    console.log(`     ⚠️  Tiene wger_id: ${ex.wger_id}`);
                }
                console.log('');
            });
        } else {
            console.log('✅ Todos los ejercicios tienen al menos una imagen o video válida\n');
        }
        
        // Estadísticas
        const withValidGif = allExercises.filter(ex => 
            ex.gif_url && 
            ex.gif_url.trim().length > 0 && 
            ex.gif_url !== 'null' && 
            ex.gif_url !== 'undefined'
        );
        
        const withValidVideo = allExercises.filter(ex => 
            ex.video_url && 
            ex.video_url.trim().length > 0 && 
            ex.video_url !== 'null' && 
            ex.video_url !== 'undefined'
        );
        
        console.log(`\n📊 ESTADÍSTICAS:`);
        console.log(`   Con gif_url válido: ${withValidGif.length}`);
        console.log(`   Con video_url válido: ${withValidVideo.length}`);
        console.log(`   Sin imagen válida: ${invalidImages.length}\n`);
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

checkExercisesWithInvalidImages()
    .then(() => {
        console.log('✅ Verificación completada.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

