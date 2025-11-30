// Script para actualizar ejercicios existentes con imágenes y videos desde los mapas de wger
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, isNull, and, or } = require('drizzle-orm');

const WGER_API_BASE = 'https://wger.de/api/v2';

// Obtener todas las imágenes disponibles y crear un mapa ejercicio_id -> image_url
async function getAllExerciseImages() {
    console.log('🖼️  Obteniendo todas las imágenes disponibles desde /exerciseimage/...');
    const imageMap = new Map();
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        try {
            const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
                params: {
                    limit: 100,
                    offset: (page - 1) * 100
                },
                timeout: 10000
            });
            
            if (!response.data || !response.data.results || response.data.results.length === 0) {
                hasMore = false;
                break;
            }
            
            response.data.results.forEach(img => {
                const exerciseId = img.exercise;
                if (img.image) {
                    if (!imageMap.has(exerciseId) || img.is_main) {
                        let imageUrl = img.image;
                        if (!imageUrl.startsWith('http')) {
                            imageUrl = `https://wger.de${imageUrl}`;
                        }
                        imageMap.set(exerciseId, imageUrl);
                    }
                }
            });
            
            if (!response.data.next) {
                hasMore = false;
            } else {
                page++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`   ⚠️  Error obteniendo imágenes página ${page}:`, error.message);
            hasMore = false;
        }
    }
    
    console.log(`   ✅ Mapa de imágenes creado: ${imageMap.size} ejercicios con imágenes\n`);
    return imageMap;
}

// Obtener todos los videos disponibles
async function getAllExerciseVideos() {
    console.log('🎥 Obteniendo todos los videos disponibles desde /video/...');
    const videoMap = new Map();
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        try {
            const response = await axios.get(`${WGER_API_BASE}/video/`, {
                params: {
                    limit: 100,
                    offset: (page - 1) * 100
                },
                timeout: 10000
            });
            
            if (!response.data || !response.data.results || response.data.results.length === 0) {
                hasMore = false;
                break;
            }
            
            response.data.results.forEach(video => {
                const exerciseId = video.exercise;
                if (video.video && !videoMap.has(exerciseId)) {
                    let videoUrl = video.video;
                    if (!videoUrl.startsWith('http')) {
                        videoUrl = `https://wger.de${videoUrl}`;
                    }
                    videoMap.set(exerciseId, videoUrl);
                }
            });
            
            if (!response.data.next) {
                hasMore = false;
            } else {
                page++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`   ⚠️  Error obteniendo videos página ${page}:`, error.message);
            hasMore = false;
        }
    }
    
    console.log(`   ✅ Mapa de videos creado: ${videoMap.size} ejercicios con videos\n`);
    return videoMap;
}

async function updateExercisesMedia() {
    console.log('🔄 Iniciando actualización de media para ejercicios existentes...\n');
    
    try {
        // Obtener mapas de imágenes y videos
        const [imageMap, videoMap] = await Promise.all([
            getAllExerciseImages(),
            getAllExerciseVideos()
        ]);

        // Obtener todos los ejercicios con wger_id
        const allExercises = await db.select()
            .from(exercises)
            .where(eq(exercises.wger_id, exercises.wger_id)); // Obtener todos los que tienen wger_id
        
        console.log(`📦 Actualizando ${allExercises.length} ejercicios existentes...\n`);
        
        let stats = {
            total: allExercises.length,
            updated: 0,
            withImage: 0,
            withVideo: 0,
            skipped: 0
        };

        for (const exercise of allExercises) {
            if (!exercise.wger_id) {
                stats.skipped++;
                continue;
            }

            const updateData = {};
            let needsUpdate = false;

            // Buscar imagen en el mapa
            const imageUrl = imageMap.get(exercise.wger_id);
            if (imageUrl) {
                // Actualizar si no tiene imagen o si la actual está vacía
                if (!exercise.gif_url || exercise.gif_url.trim().length === 0) {
                    updateData.gif_url = imageUrl;
                    needsUpdate = true;
                    stats.withImage++;
                }
            }

            // Buscar video en el mapa
            const videoUrl = videoMap.get(exercise.wger_id);
            if (videoUrl) {
                // Actualizar si no tiene video o si el actual está vacío
                if (!exercise.video_url || exercise.video_url.trim().length === 0) {
                    updateData.video_url = videoUrl;
                    needsUpdate = true;
                    stats.withVideo++;
                }
            }

            // Actualizar en la base de datos
            if (needsUpdate) {
                await db.update(exercises)
                    .set(updateData)
                    .where(eq(exercises.exercise_id, exercise.exercise_id));
                stats.updated++;
                
                if (stats.updated % 50 === 0) {
                    console.log(`   ✅ ${stats.updated} ejercicios actualizados...`);
                }
            } else {
                stats.skipped++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE ACTUALIZACIÓN');
        console.log('='.repeat(60));
        console.log(`Total de ejercicios procesados: ${stats.total}`);
        console.log(`✅ Ejercicios actualizados: ${stats.updated}`);
        console.log(`🖼️  Ejercicios con imágenes añadidas: ${stats.withImage}`);
        console.log(`🎥 Ejercicios con videos añadidos: ${stats.withVideo}`);
        console.log(`⏭️  Ejercicios omitidos (ya tienen media): ${stats.skipped}`);
        console.log('='.repeat(60) + '\n');

        console.log('✅ Actualización completada!\n');

    } catch (error) {
        console.error('❌ Error en actualización:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    updateExercisesMedia()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { updateExercisesMedia };

