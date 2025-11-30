// Script para eliminar ejercicios que no tienen imágenes
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, isNull, and, sql } = require('drizzle-orm');

async function removeExercisesWithoutImages() {
    console.log('🧹 Iniciando eliminación de ejercicios sin imágenes...\n');
    
    try {
        // 1. Obtener todos los ejercicios públicos sin imágenes
        console.log('📋 Buscando ejercicios sin imágenes...');
        const exercisesWithoutImages = await db.select()
            .from(exercises)
            .where(
                and(
                    eq(exercises.is_public, true),
                    isNull(exercises.gif_url),
                    isNull(exercises.video_url)
                )
            );
        
        console.log(`   Encontrados ${exercisesWithoutImages.length} ejercicios sin imágenes\n`);
        
        if (exercisesWithoutImages.length === 0) {
            console.log('✅ No hay ejercicios sin imágenes para eliminar');
            process.exit(0);
        }
        
        // 2. Verificar referencias en otras tablas
        console.log('🔍 Verificando referencias en otras tablas...\n');
        
        let stats = {
            total: exercisesWithoutImages.length,
            withRoutineReferences: 0,
            withDailyLogReferences: 0,
            safeToDelete: 0,
            deleted: 0,
            errors: 0
        };
        
        const toDelete = [];
        
        for (const exercise of exercisesWithoutImages) {
            // Verificar si está en rutinas
            const inRoutines = await db.select()
                .from(routineExercises)
                .where(eq(routineExercises.exercise_id, exercise.exercise_id))
                .limit(1);
            
            // Verificar si está en logs diarios
            const inDailyLogs = await db.select()
                .from(dailyExercises)
                .where(eq(dailyExercises.exercise_id, exercise.exercise_id))
                .limit(1);
            
            if (inRoutines.length > 0) {
                stats.withRoutineReferences++;
                console.log(`   ⚠️  "${exercise.name}" tiene referencias en rutinas - NO se eliminará`);
            } else if (inDailyLogs.length > 0) {
                stats.withDailyLogReferences++;
                console.log(`   ⚠️  "${exercise.name}" tiene referencias en logs diarios - NO se eliminará`);
            } else {
                stats.safeToDelete++;
                toDelete.push(exercise);
            }
        }
        
        console.log(`\n📊 Resumen de verificación:`);
        console.log(`   Total sin imágenes: ${stats.total}`);
        console.log(`   Con referencias en rutinas: ${stats.withRoutineReferences}`);
        console.log(`   Con referencias en logs: ${stats.withDailyLogReferences}`);
        console.log(`   Seguros para eliminar: ${stats.safeToDelete}\n`);
        
        // 3. Eliminar ejercicios seguros
        if (toDelete.length > 0) {
            console.log(`🗑️  Eliminando ${toDelete.length} ejercicios sin imágenes y sin referencias...\n`);
            
            for (const exercise of toDelete) {
                try {
                    await db.delete(exercises)
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    
                    stats.deleted++;
                    console.log(`   ✅ Eliminado: "${exercise.name}"`);
                } catch (error) {
                    stats.errors++;
                    console.error(`   ❌ Error al eliminar "${exercise.name}":`, error.message);
                }
            }
        } else {
            console.log('ℹ️  No hay ejercicios seguros para eliminar (todos tienen referencias)\n');
        }
        
        // 4. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`📋 Total de ejercicios sin imágenes: ${stats.total}`);
        console.log(`⚠️  Con referencias (no eliminados): ${stats.withRoutineReferences + stats.withDailyLogReferences}`);
        console.log(`✅ Eliminados exitosamente: ${stats.deleted}`);
        console.log(`❌ Errores: ${stats.errors}`);
        console.log('='.repeat(60) + '\n');
        
        // 5. Verificar total final
        const finalCount = await db.select({
            count: sql`count(*)`.as('count')
        }).from(exercises).where(eq(exercises.is_public, true));
        
        const withImagesCount = await db.select({
            count: sql`count(*)`.as('count')
        }).from(exercises).where(
            and(
                eq(exercises.is_public, true),
                sql`(gif_url IS NOT NULL OR video_url IS NOT NULL)`
            )
        );
        
        console.log(`💾 Estado final de la base de datos:`);
        console.log(`   Total de ejercicios públicos: ${finalCount[0].count}`);
        console.log(`   Ejercicios con imágenes: ${withImagesCount[0].count}`);
        console.log(`   Porcentaje con imágenes: ${((withImagesCount[0].count / finalCount[0].count) * 100).toFixed(1)}%\n`);
        
        console.log('✅ Proceso completado!');
        
    } catch (error) {
        console.error('❌ Error en el proceso:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

removeExercisesWithoutImages();

