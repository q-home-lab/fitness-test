/**
 * Script para crear un usuario de prueba con datos completos de 1 mes
 * Incluye: rutinas, ejercicios, registros de peso, comidas y ejercicios completados
 * 
 * Ejecutar: node scripts/create-test-user.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { users, routines, routineExercises, exercises, dailyLogs, mealItems, foods, dailyExercises, userGoals } = schema;
const { eq, and, inArray } = require('drizzle-orm');

// Configuración del usuario de prueba
const TEST_USER = {
    email: 'usuario.prueba@fitnessapp.com',
    password: 'TestUser123!',
    gender: 'male',
    age: 30,
    height: 175, // cm
    initialWeight: 85.0, // kg
    targetWeight: 80.0, // kg
};

// Ejercicios comunes que usaremos
const COMMON_EXERCISES = [
    { name: 'Press de banca', category: 'Fuerza', calories_per_min: 6 },
    { name: 'Sentadillas', category: 'Fuerza', calories_per_min: 8 },
    { name: 'Peso muerto', category: 'Fuerza', calories_per_min: 7 },
    { name: 'Press militar', category: 'Fuerza', calories_per_min: 6 },
    { name: 'Remo con barra', category: 'Fuerza', calories_per_min: 6 },
    { name: 'Dominadas', category: 'Fuerza', calories_per_min: 8 },
    { name: 'Flexiones', category: 'Fuerza', calories_per_min: 7 },
    { name: 'Plancha', category: 'Fuerza', calories_per_min: 5 },
    { name: 'Correr', category: 'Cardio', calories_per_min: 12 },
    { name: 'Ciclismo', category: 'Cardio', calories_per_min: 10 },
    { name: 'Burpees', category: 'Cardio', calories_per_min: 15 },
    { name: 'Jumping Jacks', category: 'Cardio', calories_per_min: 10 },
];

// Alimentos comunes que usaremos
const COMMON_FOODS = [
    { name: 'Pollo (pechuga sin piel)', calories_base: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    { name: 'Arroz blanco (cocido)', calories_base: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
    { name: 'Brócoli (cocido)', calories_base: 35, protein_g: 2.8, carbs_g: 7, fat_g: 0.4 },
    { name: 'Huevos (enteros)', calories_base: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
    { name: 'Avena (cocida)', calories_base: 68, protein_g: 2.4, carbs_g: 12, fat_g: 1.4 },
    { name: 'Plátano', calories_base: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
    { name: 'Salmón', calories_base: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
    { name: 'Pasta (cocida)', calories_base: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
    { name: 'Yogur griego natural', calories_base: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4 },
    { name: 'Pan integral', calories_base: 247, protein_g: 13, carbs_g: 41, fat_g: 4.2 },
    { name: 'Pavo (pechuga)', calories_base: 135, protein_g: 30, carbs_g: 0, fat_g: 1 },
    { name: 'Quinoa (cocida)', calories_base: 120, protein_g: 4.4, carbs_g: 22, fat_g: 1.9 },
];

// Tipos de comidas
const MEAL_TYPES = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

// Rutinas de ejemplo
const ROUTINES = [
    {
        name: 'Rutina de Fuerza - Tren Superior',
        description: 'Enfoque en pecho, espalda y hombros',
        exercises: [
            { name: 'Press de banca', sets: 4, reps: 8, weight_kg: 70 },
            { name: 'Remo con barra', sets: 4, reps: 10, weight_kg: 60 },
            { name: 'Press militar', sets: 3, reps: 10, weight_kg: 40 },
            { name: 'Flexiones', sets: 3, reps: 15, weight_kg: 0 },
        ],
        day_of_week: 1, // Lunes
    },
    {
        name: 'Rutina de Fuerza - Tren Inferior',
        description: 'Enfoque en piernas y glúteos',
        exercises: [
            { name: 'Sentadillas', sets: 4, reps: 10, weight_kg: 80 },
            { name: 'Peso muerto', sets: 4, reps: 8, weight_kg: 100 },
            { name: 'Plancha', sets: 3, duration_minutes: 1, weight_kg: 0 },
        ],
        day_of_week: 3, // Miércoles
    },
    {
        name: 'Rutina Cardio',
        description: 'Ejercicios cardiovasculares',
        exercises: [
            { name: 'Correr', sets: 1, duration_minutes: 30, weight_kg: 0 }, // 30 minutos totales
            { name: 'Burpees', sets: 3, reps: 20, weight_kg: 0 }, // 3 series de 20 repeticiones
            { name: 'Jumping Jacks', sets: 1, duration_minutes: 6, weight_kg: 0 }, // 6 minutos totales (corregido: era 2 min por serie, ahora es total)
        ],
        day_of_week: 5, // Viernes
    },
];

/**
 * Función para obtener o crear un ejercicio
 */
async function getOrCreateExercise(exerciseData) {
    const existing = await db.select()
        .from(exercises)
        .where(eq(exercises.name, exerciseData.name))
        .limit(1);

    if (existing.length > 0) {
        return existing[0];
    }

    const newExercise = await db.insert(exercises).values({
        name: exerciseData.name,
        category: exerciseData.category,
        default_calories_per_minute: exerciseData.calories_per_min.toString(),
        is_public: true,
    }).returning();

    return newExercise[0];
}

/**
 * Función para obtener o crear un alimento
 */
async function getOrCreateFood(foodData) {
    const existing = await db.select()
        .from(foods)
        .where(eq(foods.name, foodData.name))
        .limit(1);

    if (existing.length > 0) {
        return existing[0];
    }

    const newFood = await db.insert(foods).values({
        name: foodData.name,
        calories_base: foodData.calories_base.toString(),
        protein_g: foodData.protein_g.toString(),
        carbs_g: foodData.carbs_g.toString(),
        fat_g: foodData.fat_g.toString(),
    }).returning();

    return newFood[0];
}

/**
 * Función para generar peso con variación realista
 */
function generateWeight(initialWeight, dayIndex, totalDays) {
    // Pérdida de peso gradual: -0.3 kg por semana en promedio
    const weeks = dayIndex / 7;
    const baseLoss = weeks * 0.3;
    
    // Variación diaria aleatoria: ±0.3 kg
    const dailyVariation = (Math.random() - 0.5) * 0.6;
    
    const weight = initialWeight - baseLoss + dailyVariation;
    return Math.max(weight, TEST_USER.targetWeight - 1); // No bajar del objetivo - 1kg
}

/**
 * Función para generar comidas del día
 */
function generateMealsForDay() {
    const meals = [];
    const numMeals = 3 + Math.floor(Math.random() * 2); // 3-4 comidas

    for (let i = 0; i < numMeals; i++) {
        const mealType = MEAL_TYPES[i] || MEAL_TYPES[Math.floor(Math.random() * MEAL_TYPES.length)];
        const food = COMMON_FOODS[Math.floor(Math.random() * COMMON_FOODS.length)];
        const quantity = 100 + Math.floor(Math.random() * 200); // 100-300g
        
        const calories = (parseFloat(food.calories_base) * quantity) / 100;
        
        meals.push({
            food: food,
            quantity_grams: quantity,
            meal_type: mealType,
            consumed_calories: calories,
        });
    }

    return meals;
}

/**
 * Función para generar ejercicios del día basado en la rutina
 */
function generateExercisesForDay(dayOfWeek, exerciseMap) {
    const exercises = [];
    
    // Encontrar rutina para este día
    const routine = ROUTINES.find(r => r.day_of_week === dayOfWeek);
    
    if (routine && Math.random() > 0.2) { // 80% de probabilidad de hacer ejercicio
        routine.exercises.forEach((ex, index) => {
            const exercise = exerciseMap[ex.name];
            if (!exercise) {
                console.warn(`⚠️  Ejercicio "${ex.name}" no encontrado en el mapa de ejercicios. Se omite.`);
                return;
            }

            let burnedCalories = 0;
            let sets_done = ex.sets;
            let reps_done = ex.reps || null;
            let duration_minutes = ex.duration_minutes || null;
            let weight_kg = ex.weight_kg || 0;

            // Calcular calorías quemadas
            if (duration_minutes) {
                // Ejercicio de duración: duration_minutes es la duración TOTAL, no por serie
                // Basado en el código del frontend (ExerciseSearchAndAdd.jsx)
                burnedCalories = parseFloat(exercise.default_calories_per_minute) * duration_minutes;
            } else if (reps_done) {
                // Ejercicio de fuerza con repeticiones
                // Cálculo más realista basado en peso del usuario y peso levantado
                // Fórmula: (peso_usuario + peso_levantado) * factor * repeticiones
                const totalReps = sets_done * reps_done;
                const userWeight = 85; // Peso estimado del usuario en kg
                const totalWeight = userWeight + (weight_kg || 0); // Peso total movido
                // Aproximación: 0.1 kcal por kg total por repetición
                burnedCalories = totalReps * totalWeight * 0.1;
            } else {
                // Ejercicio de fuerza sin repeticiones específicas (solo sets)
                // Estimación: 5 kcal por set (basado en el código del frontend)
                burnedCalories = sets_done * 5;
            }

            // Variación realista: ±10%
            burnedCalories = burnedCalories * (0.9 + Math.random() * 0.2);

            exercises.push({
                exercise_id: exercise.exercise_id,
                sets_done: sets_done,
                reps_done: reps_done,
                duration_minutes: duration_minutes,
                weight_kg: weight_kg,
                burned_calories: burnedCalories,
            });
        });
    }

    return exercises;
}

/**
 * Función principal
 */
async function createTestUser() {
    console.log('🚀 Iniciando creación de usuario de prueba...\n');

    try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.email, TEST_USER.email))
            .limit(1);

        let userId;
        if (existingUser.length > 0) {
            console.log('⚠️  Usuario ya existe. Eliminando datos anteriores...');
            userId = existingUser[0].user_id;
            
            // Obtener IDs de logs y rutinas para eliminar datos relacionados
            const userLogs = await db.select({ log_id: dailyLogs.log_id })
                .from(dailyLogs)
                .where(eq(dailyLogs.user_id, userId));
            const logIds = userLogs.map(log => log.log_id);
            
            const userRoutines = await db.select({ routine_id: routines.routine_id })
                .from(routines)
                .where(eq(routines.user_id, userId));
            const routineIds = userRoutines.map(r => r.routine_id);
            
            // Eliminar datos relacionados (solo si hay datos para eliminar)
            if (logIds && logIds.length > 0) {
                await db.delete(dailyExercises).where(inArray(dailyExercises.log_id, logIds));
                await db.delete(mealItems).where(inArray(mealItems.log_id, logIds));
            }
            
            if (routineIds && routineIds.length > 0) {
                await db.delete(routineExercises).where(inArray(routineExercises.routine_id, routineIds));
            }
            
            await db.delete(dailyLogs).where(eq(dailyLogs.user_id, userId));
            await db.delete(routines).where(eq(routines.user_id, userId));
            await db.delete(userGoals).where(eq(userGoals.user_id, userId));
            
            // Actualizar usuario
            const password_hash = await bcrypt.hash(TEST_USER.password, 10);
            await db.update(users)
                .set({
                    password_hash: password_hash,
                    gender: TEST_USER.gender,
                    age: TEST_USER.age,
                    height: TEST_USER.height.toString(),
                    onboarding_completed: true,
                    onboarding_step: 4,
                })
                .where(eq(users.user_id, userId));
        } else {
            // 2. Crear usuario
            console.log('📝 Creando usuario...');
            const password_hash = await bcrypt.hash(TEST_USER.password, 10);
            const newUser = await db.insert(users).values({
                email: TEST_USER.email,
                password_hash: password_hash,
                gender: TEST_USER.gender,
                age: TEST_USER.age,
                height: TEST_USER.height.toString(),
                onboarding_completed: true,
                onboarding_step: 4,
            }).returning();
            userId = newUser[0].user_id;
            console.log(`✅ Usuario creado: ${TEST_USER.email} (ID: ${userId})`);
        }

        // 3. Crear objetivo
        console.log('\n🎯 Creando objetivo...');
        await db.delete(userGoals).where(eq(userGoals.user_id, userId));
        await db.insert(userGoals).values({
            user_id: userId,
            target_weight: TEST_USER.targetWeight.toString(),
            current_weight: TEST_USER.initialWeight.toString(),
            daily_calorie_goal: '2000',
            weekly_weight_change_goal: '-0.5',
            goal_type: 'weight_loss',
            is_active: true,
        });
        console.log(`✅ Objetivo creado: ${TEST_USER.initialWeight}kg → ${TEST_USER.targetWeight}kg`);

        // 4. Crear ejercicios si no existen
        console.log('\n💪 Creando ejercicios...');
        const exerciseMap = {};
        for (const ex of COMMON_EXERCISES) {
            const exercise = await getOrCreateExercise(ex);
            exerciseMap[ex.name] = exercise;
        }
        console.log(`✅ ${Object.keys(exerciseMap).length} ejercicios disponibles`);

        // 5. Crear alimentos si no existen
        console.log('\n🍎 Creando alimentos...');
        const foodMap = {};
        for (const food of COMMON_FOODS) {
            const foodItem = await getOrCreateFood(food);
            foodMap[food.name] = foodItem;
        }
        console.log(`✅ ${Object.keys(foodMap).length} alimentos disponibles`);

        // 6. Crear rutinas
        console.log('\n📋 Creando rutinas...');
        await db.delete(routines).where(eq(routines.user_id, userId));
        const routineMap = {};
        
        for (const routineData of ROUTINES) {
            const routine = await db.insert(routines).values({
                user_id: userId,
                name: routineData.name,
                description: routineData.description,
                is_active: true,
            }).returning();
            
            routineMap[routineData.name] = routine[0];
            
            // Agregar ejercicios a la rutina
            for (let i = 0; i < routineData.exercises.length; i++) {
                const exData = routineData.exercises[i];
                const exercise = exerciseMap[exData.name];
                if (!exercise) continue;

                await db.insert(routineExercises).values({
                    routine_id: routine[0].routine_id,
                    exercise_id: exercise.exercise_id,
                    sets: exData.sets,
                    reps: exData.reps || null,
                    duration_minutes: exData.duration_minutes || null,
                    weight_kg: exData.weight_kg || '0',
                    order_index: i + 1,
                    day_of_week: routineData.day_of_week,
                });
            }
            
            console.log(`✅ Rutina creada: ${routineData.name}`);
        }

        // 7. Generar datos de 30 días
        console.log('\n📅 Generando datos de 30 días...');
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);

        let totalMeals = 0;
        let totalExercises = 0;
        let totalCaloriesConsumed = 0;
        let totalCaloriesBurned = 0;

        for (let i = 0; i < 30; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.

            // Generar peso
            const weight = generateWeight(TEST_USER.initialWeight, i, 30);

            // Verificar si ya existe un log para esta fecha (por si acaso)
            const existingLog = await db.select()
                .from(dailyLogs)
                .where(and(eq(dailyLogs.user_id, userId), eq(dailyLogs.date, dateStr)))
                .limit(1);

            let logId;
            if (existingLog.length > 0) {
                // Si existe, actualizar el peso
                await db.update(dailyLogs)
                    .set({
                        weight: weight.toFixed(2),
                        consumed_calories: '0',
                        burned_calories: '0',
                    })
                    .where(eq(dailyLogs.log_id, existingLog[0].log_id));
                logId = existingLog[0].log_id;
            } else {
                // Crear log diario nuevo
                const log = await db.insert(dailyLogs).values({
                    user_id: userId,
                    date: dateStr,
                    weight: weight.toFixed(2),
                    consumed_calories: '0',
                    burned_calories: '0',
                }).returning();
                logId = log[0].log_id;
            }

            // Generar comidas (80% de los días tienen comidas registradas)
            if (Math.random() > 0.2) {
                const meals = generateMealsForDay();
                let dayCalories = 0;

                for (const meal of meals) {
                    const food = foodMap[meal.food.name];
                    if (!food) continue;

                    await db.insert(mealItems).values({
                        log_id: logId,
                        food_id: food.food_id,
                        quantity_grams: meal.quantity_grams.toString(),
                        meal_type: meal.meal_type,
                        consumed_calories: meal.consumed_calories.toFixed(2),
                    });

                    dayCalories += meal.consumed_calories;
                    totalMeals++;
                }

                // Actualizar calorías consumidas
                await db.update(dailyLogs)
                    .set({ consumed_calories: dayCalories.toFixed(2) })
                    .where(eq(dailyLogs.log_id, logId));

                totalCaloriesConsumed += dayCalories;
            }

            // Generar ejercicios (60% de los días tienen ejercicios)
            const exercises = generateExercisesForDay(dayOfWeek, exerciseMap);
            if (exercises.length > 0) {
                let dayCaloriesBurned = 0;

                for (const ex of exercises) {
                    await db.insert(dailyExercises).values({
                        log_id: logId,
                        exercise_id: ex.exercise_id,
                        sets_done: ex.sets_done,
                        reps_done: ex.reps_done,
                        duration_minutes: ex.duration_minutes ? ex.duration_minutes.toString() : null,
                        weight_kg: ex.weight_kg.toString(),
                        burned_calories: ex.burned_calories.toFixed(2),
                    });

                    dayCaloriesBurned += ex.burned_calories;
                    totalExercises++;
                }

                // Actualizar calorías quemadas
                await db.update(dailyLogs)
                    .set({ burned_calories: dayCaloriesBurned.toFixed(2) })
                    .where(eq(dailyLogs.log_id, logId));

                totalCaloriesBurned += dayCaloriesBurned;
            }

            if ((i + 1) % 10 === 0) {
                console.log(`   Procesados ${i + 1}/30 días...`);
            }
        }

        console.log('\n✅ Datos generados exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   - Usuario: ${TEST_USER.email}`);
        console.log(`   - Contraseña: ${TEST_USER.password}`);
        console.log(`   - Rutinas creadas: ${ROUTINES.length}`);
        console.log(`   - Días con datos: 30`);
        console.log(`   - Registros de comidas: ${totalMeals}`);
        console.log(`   - Registros de ejercicios: ${totalExercises}`);
        console.log(`   - Calorías consumidas totales: ${totalCaloriesConsumed.toFixed(0)}`);
        console.log(`   - Calorías quemadas totales: ${totalCaloriesBurned.toFixed(0)}`);
        console.log(`   - Peso inicial: ${TEST_USER.initialWeight}kg`);
        console.log(`   - Peso objetivo: ${TEST_USER.targetWeight}kg`);
        console.log('\n🎉 ¡Usuario de prueba creado exitosamente!');
        console.log('\n💡 Puedes iniciar sesión con:');
        console.log(`   Email: ${TEST_USER.email}`);
        console.log(`   Password: ${TEST_USER.password}`);

    } catch (error) {
        console.error('\n❌ Error al crear usuario de prueba:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Ejecutar
createTestUser();

