// /routes/calendar.js
// Rutas para gestionar rutinas planificadas en el calendario

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');

const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');
const { scheduledRoutines, routines, routineExercises, exercises, dailyExercises, dailyLogs } = schema;
const { eq, and, asc, gte, lte, between, or, sql, isNull } = require('drizzle-orm');

// POST /api/calendar/schedule - Programar una rutina para una fecha
router.post('/schedule', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { routine_id, scheduled_date } = req.body;

    if (!routine_id || !scheduled_date) {
        return res.status(400).json({ error: 'routine_id y scheduled_date son obligatorios.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db.select()
            .from(routines)
            .where(and(
                eq(routines.routine_id, routine_id),
                eq(routines.user_id, user_id),
                eq(routines.is_active, true)
            ));

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }

        // Crear o actualizar la rutina planificada
        const scheduledRoutine = await db.insert(scheduledRoutines).values({
            user_id: user_id,
            routine_id: routine_id,
            scheduled_date: scheduled_date,
            is_completed: false,
        })
        .onConflictDoUpdate({
            target: [
                scheduledRoutines.user_id,
                scheduledRoutines.routine_id,
                scheduledRoutines.scheduled_date
            ],
            set: {
                is_completed: false,
                completed_at: null,
                updated_at: new Date()
            }
        })
        .returning();

        return res.status(201).json({
            message: 'Rutina planificada con éxito.',
            scheduled: scheduledRoutine[0]
        });

    } catch (error) {
        logger.error('Error al programar rutina:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al programar la rutina.' });
    }
});

// GET /api/calendar/schedule - Obtener rutinas planificadas en un rango de fechas
router.get('/schedule', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { start_date, end_date, month, year } = req.query;

    try {
        let queryConditions = [eq(scheduledRoutines.user_id, user_id)];

        // Filtrar por rango de fechas si se proporciona
        if (start_date && end_date) {
            queryConditions.push(
                between(scheduledRoutines.scheduled_date, start_date, end_date)
            );
        } else if (month && year) {
            // Filtrar por mes y año
            const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            queryConditions.push(
                between(scheduledRoutines.scheduled_date, startOfMonth, endOfMonth)
            );
        }

        const scheduled = await db
            .select({
                scheduled_id: scheduledRoutines.scheduled_id,
                routine_id: scheduledRoutines.routine_id,
                routine_name: routines.name,
                routine_description: routines.description,
                scheduled_date: scheduledRoutines.scheduled_date,
                is_completed: scheduledRoutines.is_completed,
                completed_at: scheduledRoutines.completed_at,
                created_at: scheduledRoutines.created_at,
            })
            .from(scheduledRoutines)
            .leftJoin(routines, eq(scheduledRoutines.routine_id, routines.routine_id))
            .where(and(...queryConditions))
            .orderBy(asc(scheduledRoutines.scheduled_date));

        return res.status(200).json({
            message: 'Rutinas planificadas obtenidas con éxito.',
            scheduled: scheduled
        });

    } catch (error) {
        logger.error('Error al obtener rutinas planificadas:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al obtener rutinas planificadas.' });
    }
});

// PUT /api/calendar/schedule/:scheduledId/complete - Marcar una rutina planificada como completada
router.put('/schedule/:scheduledId/complete', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const scheduled_id = parseInt(req.params.scheduledId);
    const { is_completed } = req.body;

    try {
        // Verificar que la rutina planificada pertenece al usuario
        const scheduledCheck = await db.select()
            .from(scheduledRoutines)
            .where(and(
                eq(scheduledRoutines.scheduled_id, scheduled_id),
                eq(scheduledRoutines.user_id, user_id)
            ));

        if (scheduledCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina planificada no encontrada o no pertenece al usuario.' });
        }

        const updateData = {
            is_completed: is_completed !== undefined ? is_completed : true,
            updated_at: new Date()
        };

        if (is_completed !== false) {
            updateData.completed_at = new Date();
        } else {
            updateData.completed_at = null;
        }

        const updated = await db.update(scheduledRoutines)
            .set(updateData)
            .where(eq(scheduledRoutines.scheduled_id, scheduled_id))
            .returning();

        return res.status(200).json({
            message: is_completed !== false ? 'Rutina marcada como completada.' : 'Rutina marcada como no completada.',
            scheduled: updated[0]
        });

    } catch (error) {
        logger.error('Error al actualizar estado de rutina planificada:', { error: error.message, stack: error.stack, user_id, scheduledId });
        return res.status(500).json({ error: 'Error interno del servidor al actualizar la rutina planificada.' });
    }
});

// DELETE /api/calendar/schedule/:scheduledId - Eliminar una rutina planificada
router.delete('/schedule/:scheduledId', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const scheduled_id = parseInt(req.params.scheduledId);

    try {
        // Verificar que la rutina planificada pertenece al usuario
        const scheduledCheck = await db.select()
            .from(scheduledRoutines)
            .where(and(
                eq(scheduledRoutines.scheduled_id, scheduled_id),
                eq(scheduledRoutines.user_id, user_id)
            ));

        if (scheduledCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina planificada no encontrada o no pertenece al usuario.' });
        }

        await db.delete(scheduledRoutines)
            .where(eq(scheduledRoutines.scheduled_id, scheduled_id));

        return res.status(200).json({
            message: 'Rutina planificada eliminada con éxito.',
            scheduled_id: scheduled_id
        });

    } catch (error) {
        logger.error('Error al eliminar rutina planificada:', { error: error.message, stack: error.stack, user_id, scheduledId });
        return res.status(500).json({ error: 'Error interno del servidor al eliminar la rutina planificada.' });
    }
});

// GET /api/calendar/schedule/check-completion/:date - Verificar si una rutina planificada fue completada
// Compara los ejercicios de la rutina con los ejercicios completados del día
router.get('/schedule/check-completion/:date', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const date = req.params.date;

    try {
        // Obtener rutinas planificadas para esa fecha
        const scheduledForDate = await db
            .select({
                scheduled_id: scheduledRoutines.scheduled_id,
                routine_id: scheduledRoutines.routine_id,
                routine_name: routines.name,
                scheduled_date: scheduledRoutines.scheduled_date,
                is_completed: scheduledRoutines.is_completed,
            })
            .from(scheduledRoutines)
            .leftJoin(routines, eq(scheduledRoutines.routine_id, routines.routine_id))
            .where(and(
                eq(scheduledRoutines.user_id, user_id),
                eq(scheduledRoutines.scheduled_date, date)
            ));

        if (scheduledForDate.length === 0) {
            return res.status(200).json({
                message: 'No hay rutinas planificadas para esta fecha.',
                scheduled: [],
                completion_status: {}
            });
        }

        // Para cada rutina, verificar si fue completada comparando ejercicios
        const completionStatus = {};

        for (const scheduled of scheduledForDate) {
            // Obtener ejercicios de la rutina (filtrar por día de la semana si corresponde)
            const dayOfWeek = new Date(date).getDay(); // 0 = Domingo, 1 = Lunes, etc.
            
            const routineExercisesList = await db
                .select({
                    exercise_id: routineExercises.exercise_id,
                })
                .from(routineExercises)
                .where(and(
                    eq(routineExercises.routine_id, scheduled.routine_id),
                    or(
                        eq(routineExercises.day_of_week, dayOfWeek),
                        isNull(routineExercises.day_of_week)
                    )
                ));

            // Obtener ejercicios completados ese día
            const dailyLog = await db.select({ log_id: dailyLogs.log_id })
                .from(dailyLogs)
                .where(and(
                    eq(dailyLogs.user_id, user_id),
                    eq(dailyLogs.date, date)
                ))
                .limit(1);

            let completedExercises = [];
            if (dailyLog.length > 0) {
                const completed = await db
                    .select({ exercise_id: dailyExercises.exercise_id })
                    .from(dailyExercises)
                    .where(eq(dailyExercises.log_id, dailyLog[0].log_id));
                
                completedExercises = completed.map(e => e.exercise_id);
            }

            // Comparar: si todos los ejercicios de la rutina están en los completados, está completa
            const routineExerciseIds = routineExercisesList.map(e => e.exercise_id);
            const allCompleted = routineExerciseIds.length > 0 && 
                                 routineExerciseIds.every(id => completedExercises.includes(id));

            completionStatus[scheduled.scheduled_id] = {
                routine_id: scheduled.routine_id,
                routine_name: scheduled.routine_name,
                total_exercises: routineExerciseIds.length,
                completed_exercises: routineExerciseIds.filter(id => completedExercises.includes(id)).length,
                is_completed: allCompleted || scheduled.is_completed,
            };

            // Si se detectó que está completa pero no está marcada, actualizar
            if (allCompleted && !scheduled.is_completed) {
                await db.update(scheduledRoutines)
                    .set({
                        is_completed: true,
                        completed_at: new Date(),
                        updated_at: new Date()
                    })
                    .where(eq(scheduledRoutines.scheduled_id, scheduled.scheduled_id));
                
                completionStatus[scheduled.scheduled_id].is_completed = true;
            }
        }

        return res.status(200).json({
            message: 'Estado de completitud verificado.',
            scheduled: scheduledForDate,
            completion_status: completionStatus
        });

    } catch (error) {
        logger.error('Error al verificar completitud:', { error: error.message, stack: error.stack, user_id, scheduledId });
        return res.status(500).json({ error: 'Error interno del servidor al verificar completitud.' });
    }
});

module.exports = router;

