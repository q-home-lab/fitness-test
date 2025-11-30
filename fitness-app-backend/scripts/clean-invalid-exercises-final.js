// Script para limpiar ejercicios inválidos: sin imágenes válidas y con nombres genéricos
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, isNull, and, sql, or } = require('drizzle-orm');
const logger = require('../utils/logger');

// Patrones para detectar nombres genéricos
const GENERIC_NAME_PATTERNS = [
    /^ejercicio\s+\d+$/i,           // "Ejercicio 123"
    /^exercise\s+\d+$/i,            // "Exercise 123"
    /^test\s+exercise/i,            // "Test Exercise 123"
    /^ejercicio\s+test/i,           // "Ejercicio Test 123"
    /^\d+$/,                        // Solo números "123"
    /^ejercicio$/i,                 // Solo "Ejercicio"
    /^exercise$/i,                  // Solo "Exercise"
    /^test$/i,                      // Solo "Test"
    /^integration\s+test/i,        // "Integration Test Exercise"
];

// Verificar si un nombre es genérico
function isGenericName(name) {
    if (!name || typeof name !== 'string') return true;
    
    const trimmed = name.trim();
    if (trimmed.length < 3) return true; // Nombres muy cortos
    
    // Verificar patrones genéricos
    return GENERIC_NAME_PATTERNS.some(pattern => pattern.test(trimmed));
}

// Validar URL de imagen/GIF
async function validateImageUrl(url, timeout = 5000) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return { valid: false, reason: 'URL vacía' };
    }

    // Validar formato de URL
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, reason: 'Protocolo inválido' };
        }
    } catch (error) {
        return { valid: false, reason: 'Formato de URL inválido' };
    }

    // Verificar si la URL es accesible (usar HEAD para ser más rápido)
    try {
        const response = await axios.head(url, {
            timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Acepta 404 pero no errores del servidor
        });
        
        if (response.status === 200 || response.status === 301 || response.status === 302) {
            // Verificar que sea una imagen
            const contentType = response.headers['content-type'] || '';
            if (contentType.startsWith('image/') || contentType.includes('gif')) {
                return { valid: true, status: response.status };
            }
            // Si no tiene content-type pero responde 200, asumimos que es válida
            if (response.status === 200) {
                return { valid: true, status: response.status };
            }
        }
        return { valid: false, reason: `HTTP ${response.status}` };
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            return { valid: false, reason: 'Timeout' };
        }
        if (error.response) {
            return { valid: false, reason: `HTTP ${error.response.status}` };
        }
        if (error.request) {
            return { valid: false, reason: 'Sin respuesta del servidor' };
        }
        return { valid: false, reason: error.message };
    }
}

// Función principal
async function cleanInvalidExercises() {
    console.log('🧹 Iniciando limpieza final de ejercicios inválidos...\n');
    
    try {
        // 1. Obtener todos los ejercicios públicos
        console.log('📋 Obteniendo ejercicios públicos...');
        const allExercises = await db.select()
            .from(exercises)
            .where(eq(exercises.is_public, true));
        
        console.log(`   Total de ejercicios públicos: ${allExercises.length}\n`);
        
        let stats = {
            total: allExercises.length,
            invalidName: 0,
            noValidImage: 0,
            withReferences: 0,
            toDelete: 0,
            deleted: 0,
            errors: 0,
            validated: 0
        };
        
        const toDelete = [];
        const toValidate = [];
        
        console.log('🔍 Analizando ejercicios...\n');
        
        // 2. Primera pasada: identificar ejercicios problemáticos
        for (const exercise of allExercises) {
            const issues = [];
            
            // Verificar nombre genérico
            if (isGenericName(exercise.name)) {
                issues.push('nombre genérico');
                stats.invalidName++;
            }
            
            // Verificar si tiene imagen/GIF
            if (!exercise.gif_url && !exercise.video_url) {
                issues.push('sin imagen');
                stats.noValidImage++;
            } else {
                // Marcar para validar URL
                toValidate.push(exercise);
            }
            
            // Si tiene problemas, verificar referencias
            if (issues.length > 0) {
                // Verificar referencias en rutinas
                const inRoutines = await db.select()
                    .from(routineExercises)
                    .where(eq(routineExercises.exercise_id, exercise.exercise_id))
                    .limit(1);
                
                // Verificar referencias en logs diarios
                const inDailyLogs = await db.select()
                    .from(dailyExercises)
                    .where(eq(dailyExercises.exercise_id, exercise.exercise_id))
                    .limit(1);
                
                const hasReferences = inRoutines.length > 0 || inDailyLogs.length > 0;
                const isGeneric = issues.includes('nombre genérico');
                const hasNoImage = issues.includes('sin imagen');
                
                // Eliminar ejercicios con nombres genéricos que no tengan imágenes, incluso si tienen referencias
                if (isGeneric && hasNoImage) {
                    if (hasReferences) {
                        console.log(`   ⚠️  "${exercise.name}" - Nombre genérico sin imagen, ELIMINANDO (tiene referencias pero se eliminará)`);
                    }
                    toDelete.push({ exercise, issues });
                    stats.toDelete++;
                } else if (hasReferences) {
                    stats.withReferences++;
                    console.log(`   ⚠️  "${exercise.name}" - Tiene referencias, NO se eliminará (${issues.join(', ')})`);
                } else {
                    toDelete.push({ exercise, issues });
                    stats.toDelete++;
                }
            }
        }
        
        console.log(`\n📊 Resumen de análisis:`);
        console.log(`   Ejercicios con nombre genérico: ${stats.invalidName}`);
        console.log(`   Ejercicios sin imagen: ${stats.noValidImage}`);
        console.log(`   Ejercicios con referencias (no eliminables): ${stats.withReferences}`);
        console.log(`   Ejercicios marcados para eliminar: ${stats.toDelete}\n`);
        
        // 3. Validar URLs de imágenes (en lotes para no sobrecargar)
        console.log('🖼️  Validando URLs de imágenes...\n');
        const batchSize = 10;
        let validImages = 0;
        let invalidImages = 0;
        
        for (let i = 0; i < toValidate.length; i += batchSize) {
            const batch = toValidate.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(toValidate.length / batchSize);
            
            console.log(`   Validando lote ${batchNumber}/${totalBatches} (${batch.length} ejercicios)...`);
            
            const validationResults = await Promise.all(
                batch.map(async (exercise) => {
                    const imageUrl = exercise.gif_url || exercise.video_url;
                    if (!imageUrl) return { exercise, valid: false };
                    
                    const validation = await validateImageUrl(imageUrl, 5000);
                    return { exercise, valid: validation.valid, reason: validation.reason };
                })
            );
            
            for (const result of validationResults) {
                if (result.valid) {
                    validImages++;
                } else {
                    invalidImages++;
                    // Si la imagen no es válida y no tiene referencias, agregar a eliminar
                    const hasReferences = toDelete.some(item => 
                        item.exercise.exercise_id === result.exercise.exercise_id
                    );
                    
                    if (!hasReferences) {
                        // Verificar referencias antes de agregar
                        const inRoutines = await db.select()
                            .from(routineExercises)
                            .where(eq(routineExercises.exercise_id, result.exercise.exercise_id))
                            .limit(1);
                        
                        const inDailyLogs = await db.select()
                            .from(dailyExercises)
                            .where(eq(dailyExercises.exercise_id, result.exercise.exercise_id))
                            .limit(1);
                        
                        if (inRoutines.length === 0 && inDailyLogs.length === 0) {
                            // Verificar si ya está en la lista
                            const exists = toDelete.find(item => 
                                item.exercise.exercise_id === result.exercise.exercise_id
                            );
                            if (!exists) {
                                toDelete.push({ 
                                    exercise: result.exercise, 
                                    issues: [`imagen inválida (${result.reason})`] 
                                });
                            }
                        }
                    }
                }
            }
            
            stats.validated += batch.length;
            
            // Pequeña pausa entre lotes para no sobrecargar
            if (i + batchSize < toValidate.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`\n   ✅ Imágenes válidas: ${validImages}`);
        console.log(`   ❌ Imágenes inválidas: ${invalidImages}\n`);
        
        // 4. Eliminar ejercicios marcados
        if (toDelete.length > 0) {
            console.log(`🗑️  Eliminando ${toDelete.length} ejercicios inválidos...\n`);
            
            for (const { exercise, issues } of toDelete) {
                try {
                    // Primero eliminar referencias en otras tablas
                    const inRoutines = await db.select()
                        .from(routineExercises)
                        .where(eq(routineExercises.exercise_id, exercise.exercise_id));
                    
                    const inDailyLogs = await db.select()
                        .from(dailyExercises)
                        .where(eq(dailyExercises.exercise_id, exercise.exercise_id));
                    
                    if (inRoutines.length > 0) {
                        await db.delete(routineExercises)
                            .where(eq(routineExercises.exercise_id, exercise.exercise_id));
                        console.log(`   🗑️  Eliminadas ${inRoutines.length} referencias en rutinas`);
                    }
                    
                    if (inDailyLogs.length > 0) {
                        await db.delete(dailyExercises)
                            .where(eq(dailyExercises.exercise_id, exercise.exercise_id));
                        console.log(`   🗑️  Eliminadas ${inDailyLogs.length} referencias en logs diarios`);
                    }
                    
                    // Ahora eliminar el ejercicio
                    await db.delete(exercises)
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    
                    stats.deleted++;
                    console.log(`   ✅ Eliminado: "${exercise.name}" (${issues.join(', ')})`);
                } catch (error) {
                    stats.errors++;
                    console.error(`   ❌ Error al eliminar "${exercise.name}":`, error.message);
                }
            }
        } else {
            console.log('ℹ️  No hay ejercicios para eliminar\n');
        }
        
        // 5. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`📋 Total analizados: ${stats.total}`);
        console.log(`❌ Ejercicios con nombre genérico: ${stats.invalidName}`);
        console.log(`🖼️  Ejercicios sin imagen: ${stats.noValidImage}`);
        console.log(`⚠️  Ejercicios con referencias (conservados): ${stats.withReferences}`);
        console.log(`✅ Imágenes validadas: ${validImages}`);
        console.log(`❌ Imágenes inválidas encontradas: ${invalidImages}`);
        console.log(`🗑️  Ejercicios eliminados: ${stats.deleted}`);
        console.log(`❌ Errores: ${stats.errors}`);
        console.log('='.repeat(60) + '\n');
        
        // 6. Verificar estado final
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
        logger.error('Error en el proceso de limpieza:', {
            error: error.message,
            stack: error.stack
        });
        console.error('❌ Error en el proceso:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

cleanInvalidExercises();

