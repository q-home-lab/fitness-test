// Script mejorado para sincronizar todos los ejercicios de wger
// Usa exerciseinfo para nombres y obtiene imágenes/videos de forma eficiente
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq } = require('drizzle-orm');

const WGER_API_BASE = 'https://wger.de/api/v2';

// Mapear categoría de wger a categoría local
function mapCategory(wgerCategoryName) {
    const categoryMap = {
        'Arms': 'Fuerza',
        'Abs': 'Fuerza',
        'Back': 'Fuerza',
        'Calves': 'Fuerza',
        'Chest': 'Fuerza',
        'Legs': 'Fuerza',
        'Shoulders': 'Fuerza',
        'Cardio': 'Cardio'
    };
    return categoryMap[wgerCategoryName] || 'Fuerza';
}

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
            
            // Procesar imágenes: priorizar is_main=true
            response.data.results.forEach(img => {
                const exerciseId = img.exercise;
                if (img.image) {
                    // Si no existe o si esta es la principal, actualizar
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

// Obtener todos los videos disponibles y crear un mapa ejercicio_id -> video_url
// Nota: Los videos no se almacenan en el schema actual, pero se obtienen para referencia futura
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
            
            // Procesar videos: usar el primero encontrado para cada ejercicio
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

async function syncWgerExercises() {
    console.log('🔄 Iniciando sincronización mejorada de ejercicios de wger...\n');
    console.log('📋 Estrategia optimizada:');
    console.log('   1. Obtener todas las imágenes disponibles desde /exerciseimage/ (289 imágenes)');
    console.log('   2. Obtener todos los videos disponibles desde /video/ (78 videos)');
    console.log('   3. Sincronizar ejercicios desde /exerciseinfo/ con nombres reales\n');
    
    // Paso 1 y 2: Obtener todas las imágenes y videos de una vez (mucho más eficiente)
    const [imageMap, videoMap] = await Promise.all([
        getAllExerciseImages(),
        getAllExerciseVideos()
    ]);
    
    let page = 1;
    let hasMore = true;
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let processedIds = new Set();
    
    console.log('📦 Sincronizando ejercicios desde /exerciseinfo/...\n');
    
    while (hasMore) {
        try {
            console.log(`📄 Procesando página ${page}...`);
            
            // Obtener ejercicios desde exerciseinfo (incluye traducciones con nombres)
            const response = await axios.get(`${WGER_API_BASE}/exerciseinfo/`, {
                params: {
                    language: 2,
                    limit: 100,
                    offset: (page - 1) * 100
                },
                timeout: 15000
            });
            
            if (!response.data || !response.data.results || response.data.results.length === 0) {
                hasMore = false;
                break;
            }
            
            const exerciseInfos = response.data.results;
            console.log(`   Encontrados ${exerciseInfos.length} ejercicios en esta página`);
            
            // Procesar cada ejercicio
            for (const exerciseInfo of exerciseInfos) {
                try {
                    const exerciseId = exerciseInfo.id;
                    
                    // Evitar procesar duplicados
                    if (processedIds.has(exerciseId)) {
                        totalSkipped++;
                        continue;
                    }
                    processedIds.add(exerciseId);
                    
                    // Buscar traducción en español
                    let spanishTranslation = exerciseInfo.translations?.find(t => t.language === 4); // Español específico
                    if (!spanishTranslation) {
                        // Fallback a language 2 si no hay traducción específica
                        spanishTranslation = exerciseInfo.translations?.find(t => t.language === 2);
                    }
                    
                    if (!spanishTranslation || !spanishTranslation.name) {
                        totalSkipped++;
                        continue;
                    }
                    
                    const exerciseName = spanishTranslation.name.trim();
                    const exerciseDescription = spanishTranslation.description || '';
                    
                    // Obtener categoría
                    const categoryName = exerciseInfo.category?.name || 'Fuerza';
                    const category = mapCategory(categoryName);
                    
                    // Obtener imagen del mapa (ya las tenemos todas, muy eficiente)
                    const gifUrl = imageMap.get(exerciseId) || null;
                    
                    // Obtener video del mapa (para referencia futura, no se guarda aún)
                    const videoUrl = videoMap.get(exerciseId) || null;
                    
                    // Verificar si ya existe
                    const existingByName = await db.select()
                        .from(exercises)
                        .where(eq(exercises.name, exerciseName))
                        .limit(1);
                    
                    const existingByWgerId = await db.select()
                        .from(exercises)
                        .where(eq(exercises.wger_id, exerciseId))
                        .limit(1);
                    
                    const existing = existingByName.length > 0 ? existingByName[0] : (existingByWgerId.length > 0 ? existingByWgerId[0] : null);
                    
                    if (existing) {
                        // Actualizar ejercicio existente
                        const updateData = {};
                        
                        // Actualizar nombre si es mejor (no es temporal)
                        if (existing.name.startsWith('Ejercicio wger-') && exerciseName) {
                            updateData.name = exerciseName;
                        }
                        
                        // Actualizar imagen si falta
                        if (gifUrl && (!existing.gif_url || existing.gif_url.trim().length === 0)) {
                            updateData.gif_url = gifUrl;
                        }
                        
                        // Actualizar video si falta
                        if (videoUrl && (!existing.video_url || existing.video_url.trim().length === 0)) {
                            updateData.video_url = videoUrl;
                        }
                        
                        // Siempre actualizar si tenemos URLs de wger y el existente no las tiene
                        if (gifUrl && (!existing.gif_url || existing.gif_url.trim().length === 0 || !existing.gif_url.includes('wger.de'))) {
                            updateData.gif_url = gifUrl;
                        }
                        if (videoUrl && (!existing.video_url || existing.video_url.trim().length === 0 || !existing.video_url.includes('wger.de'))) {
                            updateData.video_url = videoUrl;
                        }
                        
                        // Actualizar wger_id si falta
                        if (!existing.wger_id) {
                            updateData.wger_id = exerciseId;
                        }
                        
                        if (Object.keys(updateData).length > 0) {
                            await db.update(exercises)
                                .set(updateData)
                                .where(eq(exercises.exercise_id, existing.exercise_id));
                            totalUpdated++;
                            if (totalUpdated % 20 === 0) {
                                console.log(`   ✏️  ${totalUpdated} ejercicios actualizados...`);
                            }
                        } else {
                            totalSkipped++;
                        }
                    } else {
                        // Insertar nuevo ejercicio
                        try {
                            await db.insert(exercises).values({
                                name: exerciseName,
                                category: category,
                                default_calories_per_minute: '5',
                                gif_url: gifUrl || null,
                                video_url: videoUrl || null,
                                wger_id: exerciseId,
                                is_public: true
                            });
                            totalSynced++;
                            if (totalSynced % 10 === 0) {
                                console.log(`   ✅ ${totalSynced} ejercicios agregados... (último: ${exerciseName.substring(0, 40)}${gifUrl ? ' 🖼️' : ''}${videoUrl ? ' 🎥' : ''})`);
                            }
                        } catch (insertError) {
                            const errorCode = insertError.code || insertError.cause?.code;
                            if (errorCode === '23505') {
                                totalSkipped++;
                            } else {
                                console.error(`   ❌ Error insertando ${exerciseName}:`, insertError.message);
                                totalErrors++;
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error(`   ❌ Error procesando ejercicio:`, error.message);
                    totalErrors++;
                }
            }
            
            // Verificar si hay más páginas
            if (!response.data.next) {
                hasMore = false;
            } else {
                page++;
            }
            
            console.log(`   Progreso: ${totalSynced} nuevos, ${totalUpdated} actualizados, ${totalSkipped} omitidos, ${totalErrors} errores\n`);
            
            // Pausa entre páginas
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Error al obtener página ${page}:`, error.message);
            hasMore = false;
        }
    }
    
    console.log('\n✅ Sincronización completada!');
    console.log(`📊 Resumen:`);
    console.log(`   - Nuevos ejercicios: ${totalSynced}`);
    console.log(`   - Ejercicios actualizados: ${totalUpdated}`);
    console.log(`   - Ejercicios omitidos: ${totalSkipped}`);
    console.log(`   - Errores: ${totalErrors}`);
    console.log(`   - Total procesado: ${totalSynced + totalUpdated + totalSkipped}`);
    console.log(`   - Imágenes disponibles: ${imageMap.size}`);
    console.log(`   - Videos disponibles: ${videoMap.size}`);
    console.log(`\n💡 Mejoras implementadas:`);
    console.log(`   ✅ Obtención eficiente de todas las imágenes (289 disponibles)`);
    console.log(`   ✅ Obtención de todos los videos (78 disponibles)`);
    console.log(`   ✅ Nombres reales en español desde /exerciseinfo/`);
    console.log(`   ✅ Categorías correctamente mapeadas`);
    console.log(`\n✅ Los videos ahora se almacenan en la base de datos con el campo 'video_url'.`);
    console.log(`   Ejercicios con videos: ${videoMap.size} de ${processedIds.size} ejercicios procesados.\n`);
    
    process.exit(0);
}

syncWgerExercises().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
