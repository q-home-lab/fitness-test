// Script para verificar ejercicios sin imagen
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq, isNull, and, sql } = require('drizzle-orm');

async function checkExercisesNoImage() {
    console.log('🔍 Verificando ejercicios sin imagen...\n');
    
    const noImage = await db.select()
        .from(exercises)
        .where(
            and(
                eq(exercises.is_public, true),
                isNull(exercises.gif_url),
                isNull(exercises.video_url)
            )
        );
    
    console.log(`Total de ejercicios sin imagen: ${noImage.length}\n`);
    
    let withRefs = 0;
    let withoutRefs = 0;
    
    for (const exercise of noImage) {
        const inRoutines = await db.select()
            .from(routineExercises)
            .where(eq(routineExercises.exercise_id, exercise.exercise_id))
            .limit(1);
        
        const inDailyLogs = await db.select()
            .from(dailyExercises)
            .where(eq(dailyExercises.exercise_id, exercise.exercise_id))
            .limit(1);
        
        if (inRoutines.length > 0 || inDailyLogs.length > 0) {
            withRefs++;
            console.log(`  ⚠️  "${exercise.name}" - Tiene referencias`);
        } else {
            withoutRefs++;
            console.log(`  ✅ "${exercise.name}" - Sin referencias (se puede eliminar)`);
        }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`   Con referencias: ${withRefs}`);
    console.log(`   Sin referencias (eliminables): ${withoutRefs}`);
    
    process.exit(0);
}

checkExercisesNoImage();

