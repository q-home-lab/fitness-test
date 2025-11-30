// Script para revisar el estado actual de los ejercicios en la base de datos
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { isNull, and, or, sql } = require('drizzle-orm');

async function checkExercisesDatabase() {
    console.log('🔍 Revisando estado de la base de datos de ejercicios...\n');

    try {
        // Obtener estadísticas generales
        const allExercises = await db.select().from(exercises);
        const total = allExercises.length;

        console.log(`📊 ESTADÍSTICAS GENERALES:`);
        console.log(`   Total de ejercicios: ${total}\n`);

        // Ejercicios con imágenes
        const withImages = allExercises.filter(e => e.gif_url && e.gif_url.trim().length > 0);
        console.log(`🖼️  Ejercicios con imágenes: ${withImages.length} (${((withImages.length / total) * 100).toFixed(1)}%)`);

        // Ejercicios con videos
        const withVideos = allExercises.filter(e => e.video_url && e.video_url.trim().length > 0);
        console.log(`🎥 Ejercicios con videos: ${withVideos.length} (${((withVideos.length / total) * 100).toFixed(1)}%)`);

        // Ejercicios con wger_id
        const withWgerId = allExercises.filter(e => e.wger_id);
        console.log(`🔗 Ejercicios con wger_id: ${withWgerId.length} (${((withWgerId.length / total) * 100).toFixed(1)}%)`);

        // Ejercicios sin media
        const withoutMedia = allExercises.filter(e => 
            (!e.gif_url || e.gif_url.trim().length === 0) && 
            (!e.video_url || e.video_url.trim().length === 0)
        );
        console.log(`⚠️  Ejercicios sin imágenes ni videos: ${withoutMedia.length} (${((withoutMedia.length / total) * 100).toFixed(1)}%)\n`);

        // Ejercicios sin nombre válido
        const withoutName = allExercises.filter(e => !e.name || e.name.trim().length === 0);
        console.log(`❌ Ejercicios sin nombre válido: ${withoutName.length}`);

        // Ejercicios sin categoría
        const withoutCategory = allExercises.filter(e => !e.category || e.category.trim().length === 0);
        console.log(`⚠️  Ejercicios sin categoría: ${withoutCategory.length}\n`);

        // Categorías disponibles
        const categories = {};
        allExercises.forEach(e => {
            const cat = e.category || 'Sin categoría';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        console.log(`📂 DISTRIBUCIÓN POR CATEGORÍAS:`);
        Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} ejercicios`);
        });
        console.log('');

        // Ejercicios duplicados (mismo nombre)
        const nameCounts = {};
        allExercises.forEach(e => {
            const name = e.name?.toLowerCase().trim() || '';
            nameCounts[name] = (nameCounts[name] || 0) + 1;
        });

        const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`⚠️  EJERCICIOS DUPLICADOS (mismo nombre): ${duplicates.length}`);
            duplicates.slice(0, 10).forEach(([name, count]) => {
                console.log(`   "${name}": ${count} veces`);
            });
            if (duplicates.length > 10) {
                console.log(`   ... y ${duplicates.length - 10} más`);
            }
            console.log('');
        }

        // Ejercicios con wger_id duplicado
        const wgerIdCounts = {};
        allExercises.forEach(e => {
            if (e.wger_id) {
                wgerIdCounts[e.wger_id] = (wgerIdCounts[e.wger_id] || 0) + 1;
            }
        });

        const duplicateWgerIds = Object.entries(wgerIdCounts).filter(([id, count]) => count > 1);
        if (duplicateWgerIds.length > 0) {
            console.log(`⚠️  EJERCICIOS CON WGER_ID DUPLICADO: ${duplicateWgerIds.length}`);
            duplicateWgerIds.slice(0, 10).forEach(([id, count]) => {
                console.log(`   wger_id ${id}: ${count} veces`);
            });
            console.log('');
        }

        // URLs problemáticas
        console.log(`🔗 ANALIZANDO URLs...`);
        const invalidUrls = [];
        allExercises.forEach(e => {
            if (e.gif_url) {
                const url = e.gif_url.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    invalidUrls.push({ exercise_id: e.exercise_id, name: e.name, url: url, type: 'gif_url' });
                }
            }
            if (e.video_url) {
                const url = e.video_url.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    invalidUrls.push({ exercise_id: e.exercise_id, name: e.name, url: url, type: 'video_url' });
                }
            }
        });

        if (invalidUrls.length > 0) {
            console.log(`   ❌ URLs con formato inválido: ${invalidUrls.length}`);
            invalidUrls.slice(0, 5).forEach(item => {
                console.log(`   - "${item.name}" (${item.type}): ${item.url.substring(0, 50)}...`);
            });
            if (invalidUrls.length > 5) {
                console.log(`   ... y ${invalidUrls.length - 5} más`);
            }
        } else {
            console.log(`   ✅ Todas las URLs tienen formato válido`);
        }
        console.log('');

        // Resumen de ejercicios que necesitan atención
        console.log(`⚠️  EJERCICIOS QUE NECESITAN ATENCIÓN:`);
        const needAttention = allExercises.filter(e => 
            (!e.name || e.name.trim().length === 0) ||
            (!e.category || e.category.trim().length === 0) ||
            ((!e.gif_url || e.gif_url.trim().length === 0) && 
             (!e.video_url || e.video_url.trim().length === 0) && 
             !e.wger_id)
        );
        console.log(`   Total: ${needAttention.length} ejercicios\n`);

        if (needAttention.length > 0) {
            console.log(`   Primeros 10 ejercicios problemáticos:`);
            needAttention.slice(0, 10).forEach(e => {
                const issues = [];
                if (!e.name || e.name.trim().length === 0) issues.push('Sin nombre');
                if (!e.category || e.category.trim().length === 0) issues.push('Sin categoría');
                if (!e.gif_url && !e.video_url && !e.wger_id) issues.push('Sin media ni wger_id');
                console.log(`   - ID ${e.exercise_id}: "${e.name || 'SIN NOMBRE'}" - ${issues.join(', ')}`);
            });
            console.log('');
        }

        console.log('✅ Revisión completada!\n');

    } catch (error) {
        console.error('❌ Error revisando base de datos:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    checkExercisesDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { checkExercisesDatabase };

