// /routes/workouts.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { dailyLogs, dailyExercises } = schema;
const { eq, and } = require('drizzle-orm');
const logger = require('../utils/logger');
const asyncHandler = require('../middleware/asyncHandler');
const { routeValidations, handleValidationErrors } = require('../middleware/validation');

// Helper para obtener o crear log por fecha
async function getOrCreateDailyLogByDate(user_id, date) {
    const existing = await db.select({ id: dailyLogs.log_id })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.user_id, user_id), eq(dailyLogs.date, date)));
    if (existing.length > 0) return existing[0].id;
    
    const newLog = await db.insert(dailyLogs).values({
        user_id,
        date,
        weight: 0, // Se debe actualizar después
        consumed_calories: 0,
        burned_calories: 0,
    }).returning({ id: dailyLogs.log_id });
    return newLog[0].id;
}

// Helper: obtain today's log or create it
async function getOrCreateDailyLog(user_id) {
    const today = new Date().toISOString().split('T')[0]; // YYYY‑MM‑DD
    const existing = await db.select({ id: dailyLogs.log_id })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.user_id, user_id), eq(dailyLogs.date, today)));
    if (existing.length > 0) return existing[0].id;
    const newLog = await db.insert(dailyLogs).values({
        user_id,
        date: today,
        weight: 0,
        consumed_calories: 0,
        burned_calories: 0,
    }).returning({ id: dailyLogs.log_id });
    return newLog[0].id;
}

// POST /api/workouts/log – register a completed exercise for today
router.post('/log', 
    authenticateToken,
    routeValidations.logWorkout || ((req, res, next) => next()), // Validación si existe
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const user_id = req.user.id;
        const {
            exercise_id,
            sets_done,
            reps_done,
            duration_minutes,
            weight_kg,
            burned_calories,
        } = req.body;

        if (!exercise_id || !sets_done || burned_calories === undefined) {
            return res.status(400).json({ error: 'exercise_id, sets_done y burned_calories son obligatorios.' });
        }

        const log_id = await getOrCreateDailyLog(user_id);
        
        // Insertar el ejercicio
        const newEntry = await db.insert(dailyExercises).values({
            log_id,
            exercise_id,
            sets_done,
            reps_done: reps_done || null,
            duration_minutes: duration_minutes || null,
            weight_kg: weight_kg || 0,
            burned_calories,
        }).returning();

        // Actualizar el total de calorías quemadas en el log diario
        const allDailyExercises = await db.select({
            burned_calories: dailyExercises.burned_calories
        })
        .from(dailyExercises)
        .where(eq(dailyExercises.log_id, log_id));

        const totalBurned = allDailyExercises.reduce((sum, ex) => {
            return sum + parseFloat(ex.burned_calories || 0);
        }, 0);

        await db.update(dailyLogs)
            .set({
                burned_calories: totalBurned.toFixed(2),
                updated_at: new Date()
            })
            .where(eq(dailyLogs.log_id, log_id));

        return res.status(201).json({
            message: 'Ejercicio registrado en el log diario.',
            dailyExercise: newEntry[0],
        });
    })
);

module.exports = router;
