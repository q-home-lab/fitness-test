const express = require('express');
const router = express.Router();

// Importamos el middleware de autenticación
const authenticateToken = require('./authMiddleware'); 
const { db } = require('../db/db_config'); // Conexión a DB
const logger = require('../utils/logger');
const asyncHandler = require('../middleware/asyncHandler'); // Wrapper para manejo de errores async

// Importamos la definición de las tablas necesarias desde el esquema
const schema = require('../db/schema'); 
const { dailyLogs, mealItems, foods, dailyExercises, exercises } = schema; // Importamos dailyLogs, mealItems, foods, dailyExercises y exercises

// Importamos funciones de Drizzle ORM
const { eq, and, asc, gte, lte } = require('drizzle-orm'); // Importamos 'asc', 'gte', 'lte' para ordenar y filtrar

// =================================================================
// 1. POST /api/logs/
// CREAR o ACTUALIZAR un log diario (para el peso o inicialización)
// =================================================================
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
    // req.user.id viene del token JWT (gracias al middleware)
    const user_id = req.user.id;
    const { date, weight } = req.body; 

    if (!date || !weight) {
        return res.status(400).json({ error: 'Faltan campos requeridos: date y weight.' });
    }

    // 1. Verificar si ya existe un log para la fecha y el usuario
    const existingLog = await db.select()
        .from(dailyLogs)
        .where(and(eq(dailyLogs.user_id, user_id), eq(dailyLogs.date, date)))
        .limit(1);

    let result;

    if (existingLog.length > 0) {
        // Log existe: lo actualizamos (solo el peso en este caso)
        result = await db.update(dailyLogs)
            .set({
                weight: weight,
                updated_at: new Date(), // Actualiza la marca de tiempo
            })
            .where(eq(dailyLogs.log_id, existingLog[0].log_id))
            .returning({ 
                log_id: dailyLogs.log_id, 
                date: dailyLogs.date, 
                weight: dailyLogs.weight,
                consumed_calories: dailyLogs.consumed_calories,
                burned_calories: dailyLogs.burned_calories,
            });

        return res.status(200).json({ 
            message: 'Log diario actualizado con éxito.', 
            log: result[0] 
        });
    } else {
        // Log no existe: creamos uno nuevo
        result = await db.insert(dailyLogs)
            .values({
                user_id: user_id,
                date: date,
                weight: weight,
                // consumed_calories y burned_calories usan el default(0) del esquema
            })
            .returning({ 
                log_id: dailyLogs.log_id, 
                date: dailyLogs.date, 
                weight: dailyLogs.weight,
                consumed_calories: dailyLogs.consumed_calories,
                burned_calories: dailyLogs.burned_calories,
            });

        return res.status(201).json({ 
            message: 'Log diario creado con éxito.', 
            log: result[0] 
        });
    }
}));


// =================================================================
// 2. GET /api/logs/weight/history
// OBTENER histórico de peso filtrado por período (día, semana, mes, año)
// IMPORTANTE: Esta ruta debe ir ANTES de /:date para evitar conflictos
// =================================================================
router.get('/weight/history', authenticateToken, asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const { period = 'month' } = req.query; // 'day', 'week', 'month', 'year'
    
    const now = new Date();
    let startDate = new Date();
    
    // Calcular fecha de inicio según el período
    switch (period) {
        case 'day':
            startDate.setDate(now.getDate() - 7); // Últimos 7 días
            break;
        case 'week':
            startDate.setDate(now.getDate() - 28); // Últimas 4 semanas
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 6); // Últimos 6 meses
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 2); // Últimos 2 años
            break;
        default:
            startDate.setMonth(now.getMonth() - 6); // Default: 6 meses
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];
    
    // Obtener logs de peso en el rango de fechas
    const filteredHistory = await db.select({
            date: dailyLogs.date,
            weight: dailyLogs.weight,
        })
        .from(dailyLogs)
        .where(and(
            eq(dailyLogs.user_id, user_id),
            gte(dailyLogs.date, startDateStr),
            lte(dailyLogs.date, endDateStr)
        ))
        .orderBy(asc(dailyLogs.date));
    
    // Formatear datos para la gráfica
    const formattedData = filteredHistory.map(log => ({
        date: log.date,
        weight: parseFloat(log.weight),
        timestamp: new Date(log.date).getTime(),
    }));
    
    return res.status(200).json({
        period: period,
        startDate: startDateStr,
        endDate: endDateStr,
        data: formattedData,
        count: formattedData.length
    });
}));

// =================================================================
// 3. GET /api/logs/:date
// OBTENER el log diario para una fecha específica, incluyendo MEAL ITEMS.
// =================================================================
router.get('/:date', authenticateToken, asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const { date } = req.params; 

    // 1. Obtener el Daily Log
    const log = await db.select()
        .from(dailyLogs)
        .where(and(eq(dailyLogs.user_id, user_id), eq(dailyLogs.date, date)))
        .limit(1);

    const dailyLog = log.length > 0 ? log[0] : null;

    if (!dailyLog) {
        // Si no hay log, devolvemos la respuesta sin mealItems ni ejercicios
        return res.status(200).json({ 
            log: null, 
            mealItems: [],
            dailyExercises: [],
            message: 'No se encontró un log para la fecha especificada.' 
        });
    }
    
    // 2. Obtener los Meal Items asociados (JOIN con la tabla foods)
    const associatedMealItems = await db.select({
            meal_item_id: mealItems.meal_item_id,
            quantity_grams: mealItems.quantity_grams,
            meal_type: mealItems.meal_type,
            consumed_calories: mealItems.consumed_calories,
            created_at: mealItems.created_at,
            food: { // Objeto anidado con los detalles del alimento
                food_id: foods.food_id,
                name: foods.name,
                calories_base: foods.calories_base,
                protein_g: foods.protein_g,
                carbs_g: foods.carbs_g,
                fat_g: foods.fat_g,
            }
        })
        .from(mealItems)
        .leftJoin(foods, eq(mealItems.food_id, foods.food_id)) // Unir con la tabla foods
        .where(eq(mealItems.log_id, dailyLog.log_id))
        .orderBy(asc(mealItems.created_at)); // Ordenar por hora de registro

    // 3. Obtener los Ejercicios Diarios asociados (JOIN con la tabla exercises)
    const associatedDailyExercises = await db.select({
            daily_exercise_id: dailyExercises.daily_exercise_id,
            sets_done: dailyExercises.sets_done,
            reps_done: dailyExercises.reps_done,
            duration_minutes: dailyExercises.duration_minutes,
            weight_kg: dailyExercises.weight_kg,
            burned_calories: dailyExercises.burned_calories,
            created_at: dailyExercises.created_at,
            exercise: { // Objeto anidado con los detalles del ejercicio
                exercise_id: exercises.exercise_id,
                name: exercises.name,
                category: exercises.category,
                gif_url: exercises.gif_url,
                video_url: exercises.video_url,
            }
        })
        .from(dailyExercises)
        .leftJoin(exercises, eq(dailyExercises.exercise_id, exercises.exercise_id)) // Unir con la tabla exercises
        .where(eq(dailyExercises.log_id, dailyLog.log_id))
        .orderBy(asc(dailyExercises.created_at)); // Ordenar por hora de registro

    return res.status(200).json({ 
        log: dailyLog,
        mealItems: associatedMealItems, // Agregamos los ítems de comida
        dailyExercises: associatedDailyExercises, // Agregamos los ejercicios diarios
        message: 'Log diario cargado con éxito, incluyendo comidas y ejercicios.'
    });
}));

module.exports = router;