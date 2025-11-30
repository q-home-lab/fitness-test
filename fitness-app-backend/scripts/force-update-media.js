// Script para forzar la actualización de media incluso si ya existe algo
// Útil para reemplazar URLs rotas o valores inválidos
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, not, and } = require('drizzle-orm');

const WGER_API_BASE = 'https://wger.de/api/v2';

async function getAllExerciseImages() {
    console.log('🖼️  Obteniendo todas las imágenes disponibles...');
    const imageMap = new Map();
    let page = 1;
    
    while (true) {
        try {
            const response = await axios.get(`${WGER_API_BASE}/exerciseimage/`, {
                params: { limit: 100, offset: (page - 1) * 100 },
                timeout: 10000
            });
            
            if (!response.data?.results?.length) break;
            
            response.data.results.forEach(img => {
                if (img.image && img.exercise) {
                    let imageUrl = img.image.startsWith('http') ? img.image : `https://wger.de${img.image}`;
                    if (!imageMap.has(img.exercise) || img.is_main) {
                        imageMap.set(img.exercise, imageUrl);
                    }
                }
            });
            
            if (!response.data.next) break;
            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`   ⚠️  Error página ${page}:`, error.message);
            break;
        }
    }
    
    console.log(`   ✅ ${imageMap.size} imágenes obtenidas\n`);
    return imageMap;
}

async function getAllExerciseVideos() {
    console.log('🎥 Obteniendo todos los videos disponibles...');
    const videoMap = new Map();
    let page = 1;
    
    while (true) {
        try {
            const response = await axios.get(`${WGER_API_BASE}/video/`, {
                params: { limit: 100, offset: (page - 1) * 100 },
                timeout: 10000
            });
            
            if (!response.data?.results?.length) break;
            
            response.data.results.forEach(video => {
                if (video.video && video.exercise && !videoMap.has(video.exercise)) {
                    let videoUrl = video.video.startsWith('http') ? video.video : `https://wger.de${video.video}`;
                    videoMap.set(video.exercise, videoUrl);
                }
            });
            
            if (!response.data.next) break;
            page++;
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`   ⚠️  Error página ${page}:`, error.message);
            break;
        }
    }
    
    console.log(`   ✅ ${videoMap.size} videos obtenidos\n`);
    return videoMap;
}

async function forceUpdateMedia() {
    console.log('🔄 Actualizando media para ejercicios con wger_id...\n');
    
    const [imageMap, videoMap] = await Promise.all([
        getAllExerciseImages(),
        getAllExerciseVideos()
    ]);

    const allExercises = await db.select()
        .from(exercises);
    
    // Filtrar solo los que tienen wger_id
    const exercisesWithWgerId = allExercises.filter(e => e.wger_id != null);

    console.log(`📦 Procesando ${exercisesWithWgerId.length} ejercicios con wger_id...\n`);

    let stats = {
        imageAdded: 0,
        videoAdded: 0,
        imageUpdated: 0,
        videoUpdated: 0,
        noChange: 0
    };

    for (const exercise of exercisesWithWgerId) {

        const updateData = {};
        const hasImage = exercise.gif_url && exercise.gif_url.trim().length > 0;
        const hasVideo = exercise.video_url && exercise.video_url.trim().length > 0;

        const newImageUrl = imageMap.get(exercise.wger_id);
        const newVideoUrl = videoMap.get(exercise.wger_id);

        // Actualizar imagen si tenemos una nueva
        if (newImageUrl) {
            if (!hasImage) {
                updateData.gif_url = newImageUrl;
                stats.imageAdded++;
            } else if (newImageUrl !== exercise.gif_url && newImageUrl.includes('wger.de')) {
                // Solo actualizar si la nueva es de wger y es diferente
                updateData.gif_url = newImageUrl;
                stats.imageUpdated++;
            }
        }

        // Actualizar video si tenemos uno nuevo
        if (newVideoUrl) {
            if (!hasVideo) {
                updateData.video_url = newVideoUrl;
                stats.videoAdded++;
            } else if (newVideoUrl !== exercise.video_url && newVideoUrl.includes('wger.de')) {
                updateData.video_url = newVideoUrl;
                stats.videoUpdated++;
            }
        }

        if (Object.keys(updateData).length > 0) {
            await db.update(exercises)
                .set(updateData)
                .where(eq(exercises.exercise_id, exercise.exercise_id));
        } else {
            stats.noChange++;
        }

        if ((stats.imageAdded + stats.videoAdded + stats.imageUpdated + stats.videoUpdated) % 50 === 0) {
            console.log(`   ✅ ${stats.imageAdded + stats.videoAdded + stats.imageUpdated + stats.videoUpdated} ejercicios actualizados...`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`🖼️  Imágenes añadidas: ${stats.imageAdded}`);
    console.log(`🖼️  Imágenes actualizadas: ${stats.imageUpdated}`);
    console.log(`🎥 Videos añadidos: ${stats.videoAdded}`);
    console.log(`🎥 Videos actualizados: ${stats.videoUpdated}`);
    console.log(`⏭️  Sin cambios: ${stats.noChange}`);
    console.log(`📊 Total procesado: ${exercisesWithWgerId.length}`);
    console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
    forceUpdateMedia()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { forceUpdateMedia };

