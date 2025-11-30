// Script para eliminar TODOS los ejercicios sin imágenes válidas, incluso si tienen referencias
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, isNull, and, sql } = require('drizzle-orm');
const logger = require('../utils/logger');

// Patrones para detectar nombres genéricos
const GENERIC_NAME_PATTERNS = [
    /^ejercicio\s+\d+$/i,
    /^exercise\s+\d+$/i,
    /^test\s+exercise/i,
    /^ejercicio\s+test/i,
    /^integration\s+test/i,
    /^\d+$/,
];

function isGenericName(name) {
    if (!name || typeof name !== 'string') return true;
    const trimmed = name.trim();
    if (trimmed.length < 3) return true;
    return GENERIC_NAME_PATTERNS.some(pattern => pattern.test(trimmed));
}

// Validar URL de imagen/GIF
async function validateImageUrl(url, timeout = 5000) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
        return { valid: false, reason: 'URL vacía' };
    }

    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, reason: 'Protocolo inválido' };
        }
    } catch (error) {
        return { valid: false, reason: 'Formato de URL inválido' };
    }

    try {
        const response = await axios.head(url, {
            timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });
        
        if (response.status === 200 || response.status === 301 || response.status === 302) {
            const contentType = response.headers['content-type'] || '';
            if (contentType.startsWith('image/') || contentType.includes('gif')) {
                return { valid: true, status: response.status };
            }
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

async function removeAllExercisesWithoutValidImages() {
    console.log('🧹 Eliminando TODOS los ejercicios sin imágenes válidas...\n');
    
    try {
        // 1. Obtener todos los ejercicios públicos
        const allExercises = await db.select()
            .from(exercises)
            .where(eq(exercises.is_public, true));
        
        console.log(`📋 Total de ejercicios públicos: ${allExercises.length}\n`);
        
        let stats = {
            total: allExercises.length,
            withValidImage: 0,
            withoutImage: 0,
            invalidImage: 0,
            genericName: 0,
            deleted: 0,
            referencesRemoved: 0,
            errors: 0
        };
        
        const toDelete = [];
        const toValidate = [];
        
        console.log('🔍 Analizando ejercicios...\n');
        
        // 2. Primera pasada: identificar ejercicios problemáticos
        for (const exercise of allExercises) {
            // Verificar nombre genérico
            if (isGenericName(exercise.name)) {
                stats.genericName++;
                toDelete.push({ exercise, reason: 'nombre genérico' });
                continue;
            }
            
            // Verificar si tiene imagen/GIF
            if (!exercise.gif_url && !exercise.video_url) {
                stats.withoutImage++;
                toDelete.push({ exercise, reason: 'sin imagen' });
            } else {
                toValidate.push(exercise);
            }
        }
        
        console.log(`   Ejercicios sin imagen: ${stats.withoutImage}`);
        console.log(`   Ejercicios con nombre genérico: ${stats.genericName}`);
        console.log(`   Ejercicios a validar: ${toValidate.length}\n`);
        
        // 3. Validar URLs de imágenes
        console.log('🖼️  Validando URLs de imágenes...\n');
        const batchSize = 10;
        
        for (let i = 0; i < toValidate.length; i += batchSize) {
            const batch = toValidate.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(toValidate.length / batchSize);
            
            if (batchNumber % 10 === 0 || batchNumber === totalBatches) {
                console.log(`   Validando lote ${batchNumber}/${totalBatches}...`);
            }
            
            const validationResults = await Promise.all(
                batch.map(async (exercise) => {
                    const imageUrl = exercise.gif_url || exercise.video_url;
                    const validation = await validateImageUrl(imageUrl, 5000);
                    return { exercise, valid: validation.valid, reason: validation.reason };
                })
            );
            
            for (const result of validationResults) {
                if (result.valid) {
                    stats.withValidImage++;
                } else {
                    stats.invalidImage++;
                    toDelete.push({ exercise: result.exercise, reason: `imagen inválida (${result.reason})` });
                }
            }
            
            // Pausa entre lotes
            if (i + batchSize < toValidate.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`\n   ✅ Imágenes válidas: ${stats.withValidImage}`);
        console.log(`   ❌ Imágenes inválidas: ${stats.invalidImage}\n`);
        
        // 4. Eliminar ejercicios marcados
        if (toDelete.length > 0) {
            console.log(`🗑️  Eliminando ${toDelete.length} ejercicios...\n`);
            
            for (const { exercise, reason } of toDelete) {
                try {
                    // Eliminar referencias primero
                    const inRoutines = await db.select()
                        .from(routineExercises)
                        .where(eq(routineExercises.exercise_id, exercise.exercise_id));
                    
                    const inDailyLogs = await db.select()
                        .from(dailyExercises)
                        .where(eq(dailyExercises.exercise_id, exercise.exercise_id));
                    
                    if (inRoutines.length > 0) {
                        await db.delete(routineExercises)
                            .where(eq(routineExercises.exercise_id, exercise.exercise_id));
                        stats.referencesRemoved += inRoutines.length;
                    }
                    
                    if (inDailyLogs.length > 0) {
                        await db.delete(dailyExercises)
                            .where(eq(dailyExercises.exercise_id, exercise.exercise_id));
                        stats.referencesRemoved += inDailyLogs.length;
                    }
                    
                    // Eliminar el ejercicio
                    await db.delete(exercises)
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    
                    stats.deleted++;
                    
                    if (stats.deleted % 10 === 0) {
                        console.log(`   ✅ ${stats.deleted} ejercicios eliminados...`);
                    }
                } catch (error) {
                    stats.errors++;
                    console.error(`   ❌ Error al eliminar "${exercise.name}":`, error.message);
                }
            }
            
            console.log(`\n   ✅ Total eliminados: ${stats.deleted}`);
            if (stats.referencesRemoved > 0) {
                console.log(`   🗑️  Referencias eliminadas: ${stats.referencesRemoved}`);
            }
        }
        
        // 5. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`📋 Total analizados: ${stats.total}`);
        console.log(`✅ Ejercicios con imágenes válidas: ${stats.withValidImage}`);
        console.log(`❌ Ejercicios sin imagen: ${stats.withoutImage}`);
        console.log(`❌ Ejercicios con imagen inválida: ${stats.invalidImage}`);
        console.log(`❌ Ejercicios con nombre genérico: ${stats.genericName}`);
        console.log(`🗑️  Ejercicios eliminados: ${stats.deleted}`);
        console.log(`🗑️  Referencias eliminadas: ${stats.referencesRemoved}`);
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
        logger.error('Error en el proceso:', {
            error: error.message,
            stack: error.stack
        });
        console.error('❌ Error en el proceso:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

removeAllExercisesWithoutValidImages();

