// Script para encontrar ejercicios con nombres genéricos
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises, routineExercises, dailyExercises } = require('../db/schema');
const { eq } = require('drizzle-orm');

const GENERIC_PATTERNS = [
    /^ejercicio\s+\d+$/i,
    /^exercise\s+\d+$/i,
    /^test\s+exercise/i,
    /^ejercicio\s+test/i,
    /^integration\s+test/i,
    /^\d+$/,
];

async function findGenericExercises() {
    const allExercises = await db.select()
        .from(exercises)
        .where(eq(exercises.is_public, true));
    
    console.log(`Total de ejercicios: ${allExercises.length}\n`);
    console.log('Ejercicios con nombres genéricos:\n');
    
    for (const exercise of allExercises) {
        const isGeneric = GENERIC_PATTERNS.some(pattern => pattern.test(exercise.name));
        
        if (isGeneric) {
            // Verificar referencias
            const inRoutines = await db.select()
                .from(routineExercises)
                .where(eq(routineExercises.exercise_id, exercise.exercise_id))
                .limit(1);
            
            const inDailyLogs = await db.select()
                .from(dailyExercises)
                .where(eq(dailyExercises.exercise_id, exercise.exercise_id))
                .limit(1);
            
            const hasImage = !!(exercise.gif_url || exercise.video_url);
            const hasRefs = inRoutines.length > 0 || inDailyLogs.length > 0;
            
            console.log(`  - "${exercise.name}"`);
            console.log(`    ID: ${exercise.exercise_id}`);
            console.log(`    Tiene imagen: ${hasImage ? 'Sí' : 'No'}`);
            console.log(`    Tiene referencias: ${hasRefs ? 'Sí' : 'No'}`);
            console.log('');
        }
    }
    
    process.exit(0);
}

findGenericExercises();

