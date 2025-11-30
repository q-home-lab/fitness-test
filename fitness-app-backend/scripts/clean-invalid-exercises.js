// Script para limpiar ejercicios inválidos de la base de datos
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, isNull, and, or } = require('drizzle-orm');

async function cleanInvalidExercises() {
    console.log('🧹 Iniciando limpieza de ejercicios inválidos...\n');

    try {
        const allExercises = await db.select().from(exercises);
        console.log(`📊 Total de ejercicios antes de la limpieza: ${allExercises.length}\n`);

        let stats = {
            deleted: 0,
            fixed: 0,
            kept: 0
        };

        // Ejercicios a eliminar
        const toDelete = [];

        for (const exercise of allExercises) {
            const issues = [];

            // Verificar nombre
            if (!exercise.name || exercise.name.trim().length === 0) {
                issues.push('Sin nombre');
            }

            // Verificar si tiene referencias en otras tablas
            const inRoutines = await db.select()
                .from(routineExercises)
                .where(eq(routineExercises.exercise_id, exercise.exercise_id))
                .limit(1);

            const inDailyLogs = await db.select()
                .from(dailyExercises)
                .where(eq(dailyExercises.exercise_id, exercise.exercise_id))
                .limit(1);

            const hasReferences = inRoutines.length > 0 || inDailyLogs.length > 0;

            // Decidir qué hacer con el ejercicio
            if (!exercise.name || exercise.name.trim().length === 0) {
                if (!hasReferences) {
                    // Sin nombre y sin referencias - eliminar
                    toDelete.push(exercise);
                    stats.deleted++;
                    console.log(`   ❌ ELIMINAR: "${exercise.name || 'Sin nombre'}" (ID ${exercise.exercise_id}) - Sin nombre y sin referencias`);
                } else {
                    // Sin nombre pero con referencias - mantener pero marcar como no público
                    console.log(`   ⚠️  MANTENER (con referencias): "${exercise.name || 'Sin nombre'}" (ID ${exercise.exercise_id}) - Tiene referencias, marcando como no público`);
                    await db.update(exercises)
                        .set({ 
                            is_public: false,
                            name: exercise.name || `Ejercicio ${exercise.exercise_id} (sin nombre)`
                        })
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    stats.fixed++;
                }
            } else if (!exercise.category || exercise.category.trim().length === 0) {
                // Sin categoría - arreglar
                console.log(`   🔧 ARREGLAR: "${exercise.name}" (ID ${exercise.exercise_id}) - Añadiendo categoría "Fuerza"`);
                await db.update(exercises)
                    .set({ category: 'Fuerza' })
                    .where(eq(exercises.exercise_id, exercise.exercise_id));
                stats.fixed++;
                stats.kept++;
            } else {
                stats.kept++;
            }
        }

        // Eliminar ejercicios marcados para eliminación
        if (toDelete.length > 0) {
            console.log(`\n🗑️  Eliminando ${toDelete.length} ejercicios inválidos...`);
            for (const exercise of toDelete) {
                await db.delete(exercises).where(eq(exercises.exercise_id, exercise.exercise_id));
            }
            console.log(`   ✅ ${toDelete.length} ejercicios eliminados\n`);
        }

        // Eliminar duplicados (mismo nombre)
        console.log(`🔍 Buscando duplicados por nombre...`);
        const nameGroups = {};
        const remainingExercises = await db.select().from(exercises);
        
        remainingExercises.forEach(e => {
            const nameKey = e.name?.toLowerCase().trim() || '';
            if (!nameGroups[nameKey]) {
                nameGroups[nameKey] = [];
            }
            nameGroups[nameKey].push(e);
        });

        let duplicatesDeleted = 0;
        for (const [nameKey, group] of Object.entries(nameGroups)) {
            if (group.length > 1 && nameKey) {
                // Mantener el primero (más antiguo o con más datos)
                // Ordenar: primero el que tenga más datos (imagen, video, wger_id)
                group.sort((a, b) => {
                    const scoreA = (a.gif_url ? 1 : 0) + (a.video_url ? 1 : 0) + (a.wger_id ? 1 : 0);
                    const scoreB = (b.gif_url ? 1 : 0) + (b.video_url ? 1 : 0) + (b.wger_id ? 1 : 0);
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    return a.exercise_id - b.exercise_id; // Mantener el más antiguo
                });

                const toKeep = group[0];
                const toRemove = group.slice(1);

                for (const dup of toRemove) {
                    // Verificar si tiene referencias
                    const inRoutines = await db.select()
                        .from(routineExercises)
                        .where(eq(routineExercises.exercise_id, dup.exercise_id))
                        .limit(1);

                    const inDailyLogs = await db.select()
                        .from(dailyExercises)
                        .where(eq(dailyExercises.exercise_id, dup.exercise_id))
                        .limit(1);

                    if (inRoutines.length === 0 && inDailyLogs.length === 0) {
                        // Transferir media al ejercicio que se mantiene si no la tiene
                        const updateData = {};
                        if (!toKeep.gif_url && dup.gif_url) {
                            updateData.gif_url = dup.gif_url;
                        }
                        if (!toKeep.video_url && dup.video_url) {
                            updateData.video_url = dup.video_url;
                        }
                        if (!toKeep.wger_id && dup.wger_id) {
                            updateData.wger_id = dup.wger_id;
                        }

                        if (Object.keys(updateData).length > 0) {
                            await db.update(exercises)
                                .set(updateData)
                                .where(eq(exercises.exercise_id, toKeep.exercise_id));
                        }

                        await db.delete(exercises).where(eq(exercises.exercise_id, dup.exercise_id));
                        duplicatesDeleted++;
                        console.log(`   🗑️  Eliminado duplicado: "${dup.name}" (ID ${dup.exercise_id})`);
                    }
                }
            }
        }

        if (duplicatesDeleted > 0) {
            console.log(`   ✅ ${duplicatesDeleted} duplicados eliminados\n`);
        } else {
            console.log(`   ✅ No se encontraron duplicados para eliminar\n`);
        }

        // Resumen final
        const finalCount = await db.select().from(exercises);
        console.log('='.repeat(60));
        console.log('📊 RESUMEN DE LIMPIEZA');
        console.log('='.repeat(60));
        console.log(`Ejercicios antes: ${allExercises.length}`);
        console.log(`Ejercicios después: ${finalCount.length}`);
        console.log(`Ejercicios eliminados: ${stats.deleted + duplicatesDeleted}`);
        console.log(`Ejercicios corregidos: ${stats.fixed}`);
        console.log(`Ejercicios mantenidos: ${stats.kept}`);
        console.log('='.repeat(60) + '\n');

        console.log('✅ Limpieza completada!\n');

    } catch (error) {
        console.error('❌ Error en limpieza:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanInvalidExercises()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { cleanInvalidExercises };

