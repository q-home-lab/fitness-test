// Script para eliminar TODOS los ejercicios obtenidos desde wger
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { isNotNull, inArray } = require('drizzle-orm');
const logger = require('../utils/logger');

async function removeAllWgerExercises() {
    try {
        console.log('🔍 Buscando todos los ejercicios obtenidos desde wger...\n');
        
        // Buscar todos los ejercicios con wger_id no nulo
        const exercisesToRemove = await db.select()
            .from(exercises)
            .where(isNotNull(exercises.wger_id));
        
        if (exercisesToRemove.length === 0) {
            console.log('✅ No se encontraron ejercicios de wger en la base de datos.');
            return;
        }
        
        console.log(`📋 Encontrados ${exercisesToRemove.length} ejercicios de wger para eliminar:\n`);
        exercisesToRemove.forEach(ex => {
            console.log(`   - ${ex.name} (ID: ${ex.exercise_id}, wger_id: ${ex.wger_id})`);
        });
        
        const exerciseIds = exercisesToRemove.map(ex => ex.exercise_id);
        
        // Contar referencias antes de eliminar
        console.log('\n🔍 Verificando referencias...\n');
        
        const routineRefs = await db.select()
            .from(routineExercises)
            .where(inArray(routineExercises.exercise_id, exerciseIds));
        
        const dailyRefs = await db.select()
            .from(dailyExercises)
            .where(inArray(dailyExercises.exercise_id, exerciseIds));
        
        console.log(`   Referencias en rutinas: ${routineRefs.length}`);
        console.log(`   Referencias en logs diarios: ${dailyRefs.length}\n`);
        
        if (routineRefs.length > 0 || dailyRefs.length > 0) {
            console.log('⚠️  ADVERTENCIA: Se eliminarán las siguientes referencias:');
            if (routineRefs.length > 0) {
                console.log(`   - ${routineRefs.length} ejercicios en rutinas`);
            }
            if (dailyRefs.length > 0) {
                console.log(`   - ${dailyRefs.length} ejercicios en logs diarios`);
            }
            console.log('\n');
        }
        
        // Eliminar referencias primero
        if (routineRefs.length > 0) {
            console.log('🗑️  Eliminando referencias en rutinas...');
            await db.delete(routineExercises)
                .where(inArray(routineExercises.exercise_id, exerciseIds));
            console.log(`   ✅ Eliminadas ${routineRefs.length} referencias en rutinas\n`);
        }
        
        if (dailyRefs.length > 0) {
            console.log('🗑️  Eliminando referencias en logs diarios...');
            await db.delete(dailyExercises)
                .where(inArray(dailyExercises.exercise_id, exerciseIds));
            console.log(`   ✅ Eliminadas ${dailyRefs.length} referencias en logs diarios\n`);
        }
        
        // Eliminar los ejercicios
        console.log('🗑️  Eliminando ejercicios de wger...');
        await db.delete(exercises)
            .where(isNotNull(exercises.wger_id));
        
        console.log(`\n✅ Eliminación completada exitosamente:`);
        console.log(`   - Ejercicios eliminados: ${exercisesToRemove.length}`);
        console.log(`   - Referencias en rutinas eliminadas: ${routineRefs.length}`);
        console.log(`   - Referencias en logs eliminadas: ${dailyRefs.length}\n`);
        
        // Verificar que se eliminaron
        const remaining = await db.select()
            .from(exercises)
            .where(isNotNull(exercises.wger_id));
        
        if (remaining.length > 0) {
            console.log(`⚠️  Advertencia: Quedan ${remaining.length} ejercicios de wger:`);
            remaining.forEach(ex => {
                console.log(`   - ${ex.name} (ID: ${ex.exercise_id}, wger_id: ${ex.wger_id})`);
            });
        } else {
            console.log('✅ Todos los ejercicios de wger han sido eliminados correctamente.');
        }
        
    } catch (error) {
        console.error('❌ Error al eliminar ejercicios de wger:', error);
        logger.error('Error al eliminar ejercicios de wger', { error: error.message, stack: error.stack });
        throw error;
    }
}

// Ejecutar
removeAllWgerExercises()
    .then(() => {
        console.log('\n✅ Proceso completado.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

