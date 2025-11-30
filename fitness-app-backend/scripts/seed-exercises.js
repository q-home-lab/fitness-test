// Script para poblar la base de datos con ejercicios de ejemplo
require('dotenv').config();
const { db } = require('../db/db_config');
const { exercises } = require('../db/schema');

const sampleExercises = [
    { name: 'Push Up', category: 'Fuerza', default_calories_per_minute: '8' },
    { name: 'Squat', category: 'Fuerza', default_calories_per_minute: '7' },
    { name: 'Bench Press', category: 'Fuerza', default_calories_per_minute: '6' },
    { name: 'Deadlift', category: 'Fuerza', default_calories_per_minute: '9' },
    { name: 'Pull Up', category: 'Fuerza', default_calories_per_minute: '8' },
    { name: 'Running', category: 'Cardio', default_calories_per_minute: '12' },
    { name: 'Cycling', category: 'Cardio', default_calories_per_minute: '10' },
    { name: 'Burpees', category: 'Híbrido', default_calories_per_minute: '15' },
    { name: 'Jump Rope', category: 'Cardio', default_calories_per_minute: '13' },
    { name: 'Plank', category: 'Fuerza', default_calories_per_minute: '5' },
    { name: 'Lunges', category: 'Fuerza', default_calories_per_minute: '7' },
    { name: 'Bicep Curl', category: 'Fuerza', default_calories_per_minute: '4' },
    { name: 'Shoulder Press', category: 'Fuerza', default_calories_per_minute: '6' },
    { name: 'Leg Press', category: 'Fuerza', default_calories_per_minute: '7' },
    { name: 'Crunches', category: 'Fuerza', default_calories_per_minute: '5' },
];

async function seedExercises() {
    console.log('🌱 Poblando base de datos con ejercicios de ejemplo...');
    
    try {
        for (const exercise of sampleExercises) {
            try {
                await db.insert(exercises).values({
                    name: exercise.name,
                    category: exercise.category,
                    default_calories_per_minute: exercise.default_calories_per_minute,
                    is_public: true
                });
                console.log(`✅ ${exercise.name} agregado`);
            } catch (error) {
                if (error.code === '23505' || error.cause?.code === '23505') {
                    console.log(`⚠️  ${exercise.name} ya existe, saltando...`);
                } else {
                    console.error(`❌ Error al agregar ${exercise.name}:`, error.message);
                }
            }
        }
        
        console.log('✅ Proceso completado!');
    } catch (error) {
        console.error('❌ Error en el proceso:', error);
    } finally {
        process.exit(0);
    }
}

seedExercises();

