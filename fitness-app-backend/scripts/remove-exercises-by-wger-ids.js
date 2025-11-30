// Script para eliminar ejercicios con wger_id específicos que generan timeouts
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, inArray } = require('drizzle-orm');
const logger = require('../utils/logger');

// IDs de wger que generan timeouts (extraídos de los logs)
const WGER_IDS_TO_REMOVE = [
    1580, 346, 1081, 1443, 1472, 829, 1284, 571, 1446, 1638, 1602, 822, 918, 916, 1007, 1575, 1504, 289, 915, 487, 569, 1709, 1536, 1338, 693, 1441, 282, 478, 1581, 567, 1728, 1445, 575, 1085, 142, 539, 1508, 314, 132, 1660, 1496, 1546, 386, 1691, 1655, 1095, 445, 1676, 1278, 996, 1113, 801, 237, 1317, 379, 323, 1689, 238, 498, 688, 1086, 1674, 135, 683, 1716, 583, 75, 538, 1226, 911, 1686, 1567, 660, 1219, 112, 197, 1493, 493, 454, 1482, 1657, 821, 1462, 659, 1485, 1467, 279, 1481, 1480, 202, 1490, 1336, 1649, 1289, 48, 1519, 1448, 1192, 1661, 1218, 1523, 983, 177, 319, 530, 1579, 1104, 962, 1093, 1285, 529, 961
];

async function removeExercisesByWgerIds() {
    try {
        console.log('🔍 Buscando ejercicios con wger_id problemáticos...\n');
        
        // Buscar ejercicios con esos wger_id
        const exercisesToRemove = await db.select()
            .from(exercises)
            .where(inArray(exercises.wger_id, WGER_IDS_TO_REMOVE));
        
        if (exercisesToRemove.length === 0) {
            console.log('✅ No se encontraron ejercicios con esos wger_id.');
            return;
        }
        
        console.log(`📋 Encontrados ${exercisesToRemove.length} ejercicios para eliminar:\n`);
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
        console.log('🗑️  Eliminando ejercicios...');
        await db.delete(exercises)
            .where(inArray(exercises.exercise_id, exerciseIds));
        
        console.log(`\n✅ Eliminados ${exercisesToRemove.length} ejercicios exitosamente:`);
        console.log(`   - Ejercicios eliminados: ${exercisesToRemove.length}`);
        console.log(`   - Referencias en rutinas eliminadas: ${routineRefs.length}`);
        console.log(`   - Referencias en logs eliminadas: ${dailyRefs.length}\n`);
        
        // Verificar que se eliminaron
        const remaining = await db.select()
            .from(exercises)
            .where(inArray(exercises.wger_id, WGER_IDS_TO_REMOVE));
        
        if (remaining.length > 0) {
            console.log(`⚠️  Advertencia: Quedan ${remaining.length} ejercicios con esos wger_id:`);
            remaining.forEach(ex => {
                console.log(`   - ${ex.name} (ID: ${ex.exercise_id}, wger_id: ${ex.wger_id})`);
            });
        } else {
            console.log('✅ Todos los ejercicios con esos wger_id han sido eliminados correctamente.');
        }
        
    } catch (error) {
        console.error('❌ Error al eliminar ejercicios:', error);
        logger.error('Error al eliminar ejercicios por wger_id', { error: error.message, stack: error.stack });
        throw error;
    }
}

// Ejecutar
removeExercisesByWgerIds()
    .then(() => {
        console.log('\n✅ Proceso completado.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

