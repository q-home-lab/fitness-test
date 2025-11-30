// Script para poblar la base de datos con ejercicios de free-exercise-db
// https://github.com/yuhonas/free-exercise-db
require('dotenv').config();
const axios = require('axios');
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');
const { eq, sql } = require('drizzle-orm');
const logger = require('../utils/logger');

// URL base para las imágenes de GitHub
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// URL del archivo JSON combinado
const EXERCISES_JSON_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

// Mapeo de categorías de free-exercise-db a nuestras categorías
function mapCategory(freeExerciseCategory) {
    const categoryMap = {
        'strength': 'Fuerza',
        'cardio': 'Cardio',
        'stretching': 'Flexibilidad',
        'strongman': 'Fuerza',
        'powerlifting': 'Fuerza',
        'olympic_weightlifting': 'Fuerza',
        'plyometrics': 'Cardio',
        'cardio': 'Cardio'
    };
    
    return categoryMap[freeExerciseCategory?.toLowerCase()] || 'Fuerza';
}

// Calcular calorías por minuto basado en el tipo de ejercicio
function calculateCaloriesPerMinute(exercise) {
    const category = exercise.category?.toLowerCase();
    const level = exercise.level?.toLowerCase();
    const mechanic = exercise.mechanic?.toLowerCase();
    
    // Base de calorías según categoría
    let baseCalories = 5;
    
    if (category === 'cardio' || category === 'plyometrics') {
        baseCalories = 12;
    } else if (category === 'strength' || category === 'powerlifting' || category === 'strongman') {
        baseCalories = 6;
    } else if (category === 'stretching') {
        baseCalories = 3;
    }
    
    // Ajustar según el nivel
    if (level === 'intermediate') {
        baseCalories *= 1.2;
    } else if (level === 'expert') {
        baseCalories *= 1.5;
    }
    
    // Ajustar según la mecánica
    if (mechanic === 'compound') {
        baseCalories *= 1.3;
    }
    
    return Math.round(baseCalories);
}

// Mapear músculos principales a grupos musculares para búsqueda
function getMuscleGroupKeywords(primaryMuscles) {
    if (!primaryMuscles || !Array.isArray(primaryMuscles)) {
        return [];
    }
    
    const muscleGroupMap = {
        'chest': ['pecho', 'chest', 'pectoral'],
        'pectorals': ['pecho', 'chest', 'pectoral'],
        'shoulders': ['hombro', 'shoulder', 'deltoid'],
        'delts': ['hombro', 'shoulder', 'deltoid'],
        'biceps': ['brazo', 'arm', 'bíceps', 'biceps'],
        'triceps': ['brazo', 'arm', 'tríceps', 'triceps'],
        'forearms': ['brazo', 'arm', 'antebrazo'],
        'lats': ['espalda', 'back', 'lat'],
        'middle back': ['espalda', 'back', 'medio'],
        'lower back': ['espalda', 'back', 'lumbar'],
        'traps': ['espalda', 'back', 'trapecio'],
        'quads': ['pierna', 'leg', 'cuádriceps', 'quad'],
        'hamstrings': ['pierna', 'leg', 'isquiotibiales'],
        'calves': ['pierna', 'leg', 'gemelos', 'calf'],
        'glutes': ['pierna', 'leg', 'glúteos', 'glute'],
        'abdominals': ['core', 'abs', 'abdominales'],
        'abs': ['core', 'abs', 'abdominales']
    };
    
    const keywords = new Set();
    primaryMuscles.forEach(muscle => {
        const muscleLower = muscle.toLowerCase();
        if (muscleGroupMap[muscleLower]) {
            muscleGroupMap[muscleLower].forEach(keyword => keywords.add(keyword));
        }
    });
    
    return Array.from(keywords);
}

// Obtener URL de imagen principal
function getImageUrl(exercise) {
    if (!exercise.images || !Array.isArray(exercise.images) || exercise.images.length === 0) {
        return null;
    }
    
    // Usar la primera imagen
    const imagePath = exercise.images[0];
    if (!imagePath) return null;
    
    // Si ya es una URL completa, devolverla
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // Construir URL de GitHub raw
    return `${GITHUB_RAW_BASE}/${imagePath}`;
}

// Limpiar nombre del ejercicio
function cleanExerciseName(name) {
    if (!name) return '';
    
    // Reemplazar guiones bajos con espacios y capitalizar
    return name
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
}

// Procesar y guardar un ejercicio
async function processExercise(exercise, existingNamesMap) {
    try {
        const exerciseName = cleanExerciseName(exercise.name);
        
        if (!exerciseName) {
            logger.warn(`Ejercicio sin nombre, saltando...`);
            return { skipped: true, reason: 'Sin nombre' };
        }
        
        const nameKey = exerciseName.toLowerCase().trim();
        const existing = existingNamesMap.get(nameKey);
        
        if (existing) {
            // Actualizar ejercicio existente
            const imageUrl = getImageUrl(exercise);
            const updateData = {
                category: mapCategory(exercise.category),
                default_calories_per_minute: calculateCaloriesPerMinute(exercise).toString(),
                is_public: true
            };
            
            if (imageUrl) {
                updateData.gif_url = imageUrl;
            }
            
            await db.update(exercises)
                .set(updateData)
                .where(eq(exercises.exercise_id, existing.exercise_id));
            
            return { updated: true, name: exerciseName };
        } else {
            // Insertar nuevo ejercicio
            const imageUrl = getImageUrl(exercise);
            
            await db.insert(exercises).values({
                name: exerciseName,
                category: mapCategory(exercise.category),
                default_calories_per_minute: calculateCaloriesPerMinute(exercise).toString(),
                gif_url: imageUrl || null,
                is_public: true
            });
            
            // Agregar al mapa para evitar duplicados en el mismo lote
            existingNamesMap.set(nameKey, { exercise_id: null, name: exerciseName });
            
            return { inserted: true, name: exerciseName };
        }
    } catch (error) {
        const errorCode = error.code || error.cause?.code;
        if (errorCode === '23505') {
            // Duplicado, saltar
            return { skipped: true, reason: 'Duplicado' };
        }
        
        logger.error(`Error procesando ejercicio ${exercise.name || 'desconocido'}:`, {
            error: error.message,
            stack: error.stack
        });
        
        return { error: true, name: exercise.name, message: error.message };
    }
}

// Función principal
async function populateExercises() {
    console.log('🚀 Iniciando poblamiento de ejercicios desde free-exercise-db...\n');
    
    try {
        // 1. Descargar el archivo JSON combinado
        console.log('📥 Descargando ejercicios desde GitHub...');
        const response = await axios.get(EXERCISES_JSON_URL, {
            timeout: 30000,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const exercisesData = response.data;
        
        if (!Array.isArray(exercisesData)) {
            throw new Error('El archivo JSON no contiene un array de ejercicios');
        }
        
        console.log(`✅ Descargados ${exercisesData.length} ejercicios\n`);
        
        // 2. Obtener ejercicios existentes para actualización
        console.log('📋 Obteniendo ejercicios existentes...');
        const existingExercises = await db.select()
            .from(exercises)
            .where(eq(exercises.is_public, true));
        
        const existingNamesMap = new Map();
        existingExercises.forEach(ex => {
            existingNamesMap.set(ex.name.toLowerCase().trim(), ex);
        });
        
        console.log(`✅ ${existingExercises.length} ejercicios existentes encontrados\n`);
        
        // 3. Procesar ejercicios en lotes
        console.log('📝 Procesando ejercicios...\n');
        const batchSize = 50;
        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        
        for (let i = 0; i < exercisesData.length; i += batchSize) {
            const batch = exercisesData.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(exercisesData.length / batchSize);
            
            console.log(`Procesando lote ${batchNumber}/${totalBatches} (${batch.length} ejercicios)...`);
            
            const results = await Promise.all(
                batch.map(exercise => processExercise(exercise, existingNamesMap))
            );
            
            results.forEach(result => {
                if (result.inserted) inserted++;
                else if (result.updated) updated++;
                else if (result.skipped) skipped++;
                else if (result.error) errors++;
            });
            
            // Mostrar progreso
            const processed = i + batch.length;
            const percentage = ((processed / exercisesData.length) * 100).toFixed(1);
            console.log(`  Progreso: ${processed}/${exercisesData.length} (${percentage}%) - Insertados: ${inserted}, Actualizados: ${updated}, Saltados: ${skipped}, Errores: ${errors}\n`);
        }
        
        // 4. Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        console.log(`✅ Ejercicios insertados: ${inserted}`);
        console.log(`🔄 Ejercicios actualizados: ${updated}`);
        console.log(`⏭️  Ejercicios saltados: ${skipped}`);
        console.log(`❌ Errores: ${errors}`);
        console.log(`📦 Total procesado: ${exercisesData.length}`);
        console.log('='.repeat(60) + '\n');
        
        // 5. Verificar total en base de datos
        const totalInDb = await db.select({
            count: sql`count(*)`.as('count')
        }).from(exercises);
        
        console.log(`💾 Total de ejercicios en base de datos: ${totalInDb[0].count}\n`);
        
        console.log('✅ Proceso completado exitosamente!');
        
    } catch (error) {
        logger.error('Error en el proceso de poblamiento:', {
            error: error.message,
            stack: error.stack
        });
        console.error('❌ Error en el proceso:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Ejecutar
populateExercises();

