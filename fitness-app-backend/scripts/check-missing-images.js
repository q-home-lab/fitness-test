// Script para verificar ejercicios que tienen URL pero no se detectan como con imagen
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, isNull, and, sql, not } = require('drizzle-orm');

async function checkMissingImages() {
    console.log('🔍 Verificando ejercicios con URLs pero sin imagen detectada...\n');
    
    // Ejercicios que tienen gif_url o video_url pero no se detectan
    const allExercises = await db.select()
        .from(exercises)
        .where(eq(exercises.is_public, true));
    
    console.log(`Total de ejercicios: ${allExercises.length}\n`);
    
    let withUrl = 0;
    let withoutUrl = 0;
    const withoutUrlList = [];
    
    for (const exercise of allExercises) {
        const hasUrl = !!(exercise.gif_url || exercise.video_url);
        
        if (hasUrl) {
            withUrl++;
        } else {
            withoutUrl++;
            withoutUrlList.push(exercise);
        }
    }
    
    console.log(`Ejercicios con URL: ${withUrl}`);
    console.log(`Ejercicios sin URL: ${withoutUrl}\n`);
    
    if (withoutUrlList.length > 0) {
        console.log('Ejercicios sin URL:');
        withoutUrlList.forEach(e => {
            console.log(`  - "${e.name}" (ID: ${e.exercise_id})`);
            console.log(`    gif_url: ${e.gif_url || 'null'}`);
            console.log(`    video_url: ${e.video_url || 'null'}`);
        });
    }
    
    process.exit(0);
}

checkMissingImages();

