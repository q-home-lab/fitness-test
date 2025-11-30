// Script para verificar estadísticas de ejercicios en la base de datos
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { isNotNull, sql } = require('drizzle-orm');

(async () => {
    try {
        const allExercises = await db.select().from(exercises);
        const total = allExercises.length;
        const withImages = allExercises.filter(ex => ex.gif_url !== null).length;
        const withVideos = allExercises.filter(ex => ex.video_url !== null).length;
        const withWgerId = allExercises.filter(ex => ex.wger_id !== null).length;
        
        console.log('📊 Estadísticas de la base de datos:');
        console.log('   Total ejercicios:', total);
        console.log('   Con imágenes:', withImages);
        console.log('   Con videos:', withVideos);
        console.log('   De wger (con wger_id):', withWgerId);
        console.log('\n💡 Ejercicios sincronizados exitosamente desde wger API!');
    } catch (e) {
        console.error('Error:', e.message);
        console.error(e.stack);
    } finally {
        process.exit(0);
    }
})();

