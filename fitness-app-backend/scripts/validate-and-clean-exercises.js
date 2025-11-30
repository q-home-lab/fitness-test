// Script para validar, limpiar y mejorar la base de datos de ejercicios
// 1. Valida URLs de imágenes y videos
// 2. Elimina ejercicios inválidos
// 3. Actualiza ejercicios sin imágenes/videos
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, isNull, and, or, sql } = require('drizzle-orm');

const WGER_API_BASE = 'https://wger.de/api/v2';

// Validar si una URL es accesible
async function validateUrl(url, timeout = 5000) {
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

    // Verificar si la URL es accesible
    try {
        const response = await axios.head(url, {
            timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Acepta 404 pero no errores del servidor
        });
        
        if (response.status === 200 || response.status === 301 || response.status === 302) {
            return { valid: true, status: response.status };
        }
        return { valid: false, reason: `HTTP ${response.status}` };
    } catch (error) {
        if (error.response) {
            return { valid: false, reason: `HTTP ${error.response.status}` };
        }
        return { valid: false, reason: error.message };
    }
}

// Obtener imagen y video desde wger API para un ejercicio específico
async function getExerciseMedia(wgerId) {
    try {
        // Buscar imagen
        const imageResponse = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
            params: { exercise: wgerId, is_main: true, limit: 1 },
            timeout: 5000
        });

        let imageUrl = null;
        if (imageResponse.data?.results?.length > 0) {
            const img = imageResponse.data.results[0];
            if (img.image) {
                imageUrl = img.image.startsWith('http') ? img.image : `https://wger.de${img.image}`;
            }
        }

        // Buscar video
        const videoResponse = await axios.get(`${WGER_API_BASE}/video/`, {
            params: { exercise: wgerId, limit: 1 },
            timeout: 5000
        });

        let videoUrl = null;
        if (videoResponse.data?.results?.length > 0) {
            const video = videoResponse.data.results[0];
            if (video.video) {
                videoUrl = video.video.startsWith('http') ? video.video : `https://wger.de${video.video}`;
            }
        }

        return { imageUrl, videoUrl };
    } catch (error) {
        console.error(`   ⚠️  Error obteniendo media para wger_id ${wgerId}:`, error.message);
        return { imageUrl: null, videoUrl: null };
    }
}

// Función principal
async function validateAndCleanExercises() {
    console.log('🔍 Iniciando validación y limpieza de ejercicios...\n');

    try {
        // Obtener todos los ejercicios
        const allExercises = await db.select().from(exercises);
        console.log(`📊 Total de ejercicios en la base de datos: ${allExercises.length}\n`);

        let stats = {
            total: allExercises.length,
            valid: 0,
            invalidUrl: 0,
            noMedia: 0,
            updated: 0,
            deleted: 0,
            errors: 0
        };

        console.log('🔎 Analizando ejercicios...\n');

        for (const exercise of allExercises) {
            try {
                // Validar nombre
                if (!exercise.name || exercise.name.trim().length === 0) {
                    console.log(`   ❌ Ejercicio ID ${exercise.exercise_id}: Sin nombre - ELIMINANDO`);
                    await db.delete(exercises).where(eq(exercises.exercise_id, exercise.exercise_id));
                    stats.deleted++;
                    continue;
                }

                // Validar categoría
                if (!exercise.category || exercise.category.trim().length === 0) {
                    console.log(`   ⚠️  Ejercicio "${exercise.name}" (ID ${exercise.exercise_id}): Sin categoría - Actualizando a "Fuerza"`);
                    await db.update(exercises)
                        .set({ category: 'Fuerza' })
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    stats.updated++;
                }

                let hasValidImage = false;
                let hasValidVideo = false;

                // Validar URL de imagen
                if (exercise.gif_url) {
                    const imageValidation = await validateUrl(exercise.gif_url, 3000);
                    if (imageValidation.valid) {
                        hasValidImage = true;
                    } else {
                        console.log(`   ⚠️  "${exercise.name}": Imagen inválida (${imageValidation.reason})`);
                    }
                }

                // Validar URL de video
                if (exercise.video_url) {
                    const videoValidation = await validateUrl(exercise.video_url, 3000);
                    if (videoValidation.valid) {
                        hasValidVideo = true;
                    } else {
                        console.log(`   ⚠️  "${exercise.name}": Video inválido (${videoValidation.reason})`);
                    }
                }

                // Si no tiene media válida y tiene wger_id, intentar obtenerlo
                if (!hasValidImage && !hasValidVideo && exercise.wger_id) {
                    console.log(`   🔄 "${exercise.name}": Sin media válida, intentando obtener desde wger...`);
                    const media = await getExerciseMedia(exercise.wger_id);
                    
                    if (media.imageUrl || media.videoUrl) {
                        const updateData = {};
                        if (media.imageUrl && !hasValidImage) {
                            updateData.gif_url = media.imageUrl;
                            hasValidImage = true;
                        }
                        if (media.videoUrl && !hasValidVideo) {
                            updateData.video_url = media.videoUrl;
                            hasValidVideo = true;
                        }

                        if (Object.keys(updateData).length > 0) {
                            await db.update(exercises)
                                .set(updateData)
                                .where(eq(exercises.exercise_id, exercise.exercise_id));
                            console.log(`   ✅ Media actualizada para "${exercise.name}"`);
                            stats.updated++;
                        }
                    } else {
                        console.log(`   ⚠️  No se pudo obtener media para "${exercise.name}"`);
                        stats.noMedia++;
                    }

                    // Pequeño delay para no sobrecargar la API
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Limpiar URLs inválidas
                const updateData = {};
                if (exercise.gif_url && !hasValidImage) {
                    updateData.gif_url = null;
                    console.log(`   🧹 Limpiando URL de imagen inválida para "${exercise.name}"`);
                }
                if (exercise.video_url && !hasValidVideo) {
                    updateData.video_url = null;
                    console.log(`   🧹 Limpiando URL de video inválida para "${exercise.name}"`);
                }

                if (Object.keys(updateData).length > 0) {
                    await db.update(exercises)
                        .set(updateData)
                        .where(eq(exercises.exercise_id, exercise.exercise_id));
                    stats.updated++;
                }

                if (hasValidImage || hasValidVideo) {
                    stats.valid++;
                } else if (!exercise.wger_id) {
                    // Si no tiene wger_id y no tiene media, marcar como sin media
                    stats.noMedia++;
                }

            } catch (error) {
                console.error(`   ❌ Error procesando ejercicio ID ${exercise.exercise_id}:`, error.message);
                stats.errors++;
            }
        }

        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE VALIDACIÓN Y LIMPIEZA');
        console.log('='.repeat(60));
        console.log(`Total de ejercicios: ${stats.total}`);
        console.log(`✅ Ejercicios con media válida: ${stats.valid}`);
        console.log(`⚠️  Ejercicios sin media: ${stats.noMedia}`);
        console.log(`🔄 Ejercicios actualizados: ${stats.updated}`);
        console.log(`🗑️  Ejercicios eliminados: ${stats.deleted}`);
        console.log(`❌ Errores: ${stats.errors}`);
        console.log('='.repeat(60) + '\n');

        // Mostrar ejercicios sin media
        const exercisesWithoutMedia = await db.select()
            .from(exercises)
            .where(and(
                isNull(exercises.gif_url),
                isNull(exercises.video_url)
            ));

        if (exercisesWithoutMedia.length > 0) {
            console.log(`⚠️  Ejercicios sin imágenes ni videos (${exercisesWithoutMedia.length}):`);
            exercisesWithoutMedia.slice(0, 10).forEach(ex => {
                console.log(`   - ${ex.name} (ID: ${ex.exercise_id}, wger_id: ${ex.wger_id || 'N/A'})`);
            });
            if (exercisesWithoutMedia.length > 10) {
                console.log(`   ... y ${exercisesWithoutMedia.length - 10} más`);
            }
            console.log('');
        }

        console.log('✅ Validación y limpieza completada!\n');

    } catch (error) {
        console.error('❌ Error en validación y limpieza:', error);
        process.exit(1);
    }
}

// Ejecutar
if (require.main === module) {
    validateAndCleanExercises()
        .then(() => {
            console.log('✅ Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { validateAndCleanExercises };

