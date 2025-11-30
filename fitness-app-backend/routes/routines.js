// /routes/routines.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware'); 

const { db } = require('../db/db_config'); 
const schema = require('../db/schema'); 
const { routines, routineExercises, exercises } = schema; 
const { eq, and, asc, isNull, sql } = require('drizzle-orm');
const logger = require('../utils/logger'); 

// --- RUTA: POST /api/routines ---
// 1. Crear una nueva rutina para el usuario logeado
router.post('/', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { name, description } = req.body; 

    if (!name) {
        return res.status(400).json({ error: 'El nombre de la rutina es obligatorio.' });
    }

    try {
        const newRoutine = await db.insert(routines).values({
            user_id: user_id,
            name: name,
            description: description || null, 
        }).returning({
            routine_id: routines.routine_id,
            name: routines.name,
            description: routines.description,
            is_active: routines.is_active,
        });

        return res.status(201).json({
            message: 'Rutina creada con éxito.',
            routine: newRoutine[0] 
        });

    } catch (error) {
        logger.error('Error al crear rutina:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al crear rutina.' });
    }
});


// --- RUTA: GET /api/routines ---
// 2. Listar todas las rutinas activas del usuario (con paginación)
router.get('/', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        // Obtener total de rutinas
        const totalResult = await db.select({
            count: sql`count(*)`.as('count')
        })
        .from(routines)
        .where(and(eq(routines.user_id, user_id), eq(routines.is_active, true)));

        const total = parseInt(totalResult[0]?.count || 0);

        // Obtener rutinas con paginación
        const userRoutines = await db.select()
            .from(routines)
            .where(and(eq(routines.user_id, user_id), eq(routines.is_active, true)))
            .orderBy(asc(routines.routine_id))
            .limit(limit)
            .offset(offset);

        return res.status(200).json({
            message: 'Lista de rutinas activas cargada con éxito.',
            routines: userRoutines,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        logger.error('Error al listar rutinas:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al listar rutinas.' });
    }
});


// --- RUTA: GET /api/routines/:routineId ---
// 3. Obtener una rutina específica con sus ejercicios vinculados
router.get('/:routineId', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const routine_id = parseInt(req.params.routineId);

    try {
        const results = await db
            .select({
                routineId: routines.routine_id,
                routineName: routines.name,
                routineDescription: routines.description,
                routineIsActive: routines.is_active,
                
                routineExerciseId: routineExercises.routine_exercise_id,
                exerciseId: exercises.exercise_id,
                exerciseName: exercises.name,
                exerciseCategory: exercises.category,
                exerciseGifUrl: exercises.gif_url,
                exerciseVideoUrl: exercises.video_url,
                exerciseWgerId: exercises.wger_id,
                
                sets: routineExercises.sets,
                reps: routineExercises.reps,
                durationMinutes: routineExercises.duration_minutes,
                weightKg: routineExercises.weight_kg,
                orderIndex: routineExercises.order_index,
                dayOfWeek: routineExercises.day_of_week,
            })
            .from(routines)
            .leftJoin(routineExercises, eq(routineExercises.routine_id, routines.routine_id))
            .leftJoin(exercises, eq(routineExercises.exercise_id, exercises.exercise_id))
            .where(and(
                eq(routines.routine_id, routine_id),
                eq(routines.user_id, user_id)
            ))
            .orderBy(asc(routineExercises.day_of_week), asc(routineExercises.order_index));

        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }

        let routineData = null;
        let exercisesList = [];

        // Agrupación de resultados
        for (const row of results) {
            if (!routineData) {
                routineData = {
                    routine_id: row.routineId,
                    name: row.routineName,
                    description: row.routineDescription,
                    is_active: row.routineIsActive,
                    exercises: [] 
                };
            }
            
            if (row.exerciseId !== null) {
                exercisesList.push({
                    routine_exercise_id: row.routineExerciseId,
                    exercise_id: row.exerciseId,
                    name: row.exerciseName,
                    category: row.exerciseCategory,
                    gif_url: row.exerciseGifUrl,
                    video_url: row.exerciseVideoUrl,
                    wger_id: row.exerciseWgerId,
                    sets: row.sets,
                    reps: row.reps,
                    duration_minutes: row.durationMinutes,
                    weight_kg: row.weightKg,
                    order_index: row.orderIndex,
                    day_of_week: row.dayOfWeek,
                });
            }
        }

        if (routineData) {
             routineData.exercises = exercisesList;
        }

        return res.status(200).json({
            message: 'Rutina cargada con éxito, incluyendo ejercicios.',
            routine: routineData
        });

    } catch (error) {
        logger.error('Error al obtener la rutina y ejercicios:', { error: error.message, stack: error.stack, user_id, routine_id });
        return res.status(500).json({ error: 'Error interno del servidor al obtener la rutina.' });
    }
});


// 🚨 NUEVA RUTA 🚨
// --- RUTA: PUT /api/routines/:routineId ---
// 4. Actualizar el nombre o descripción de una rutina.
router.put('/:routineId', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const routine_id = parseInt(req.params.routineId);
    const { name, description } = req.body;

    // Solo se permite actualizar si se proporciona al menos uno de los campos
    if (!name && description === undefined) { 
        return res.status(400).json({ error: 'Se requiere al menos el nombre o la descripción para actualizar.' });
    }
    
    // Objeto con los campos a actualizar
    const updateFields = {};
    if (name) updateFields.name = name;
    // Si la descripción se envía (incluso si es null para borrarla), se incluye.
    if (description !== undefined) updateFields.description = description;

    try {
        // Actualizar solo si la rutina pertenece al usuario
        const updatedRoutine = await db.update(routines)
            .set(updateFields)
            .where(and(eq(routines.routine_id, routine_id), eq(routines.user_id, user_id)))
            .returning();

        if (updatedRoutine.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }

        return res.status(200).json({
            message: 'Rutina actualizada con éxito.',
            routine: updatedRoutine[0]
        });

    } catch (error) {
        logger.error('Error al actualizar rutina:', { error: error.message, stack: error.stack, user_id, routine_id });
        return res.status(500).json({ error: 'Error interno del servidor al actualizar la rutina.' });
    }
});


// 🚨 NUEVA RUTA 🚨
// --- RUTA: DELETE /api/routines/:routineId ---
// 5. Eliminar (marcar como inactiva) una rutina.
router.delete('/:routineId', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const routine_id = parseInt(req.params.routineId);
    
    try {
        // Usamos .update() para marcar is_active=false (eliminación suave/soft delete)
        const deactivatedRoutine = await db.update(routines)
            .set({ is_active: false }) 
            .where(and(eq(routines.routine_id, routine_id), eq(routines.user_id, user_id)))
            .returning();

        if (deactivatedRoutine.length === 0) {
            // Si no se actualizó, es porque no existe o no pertenece al usuario
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }
        
        return res.status(200).json({
            message: 'Rutina desactivada (eliminada) con éxito.',
            routine_id: routine_id,
            new_status: 'inactive'
        });

    } catch (error) {
        logger.error('Error al desactivar rutina:', { error: error.message, stack: error.stack, user_id, routine_id });
        return res.status(500).json({ error: 'Error interno del servidor al desactivar la rutina.' });
    }
});


// --- RUTA: POST /api/routines/:routineId/exercises ---
// 6. Añadir un ejercicio a una rutina específica.
router.post('/:routineId/exercises', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const routine_id = parseInt(req.params.routineId);

    const { 
        exercise_id, 
        sets, 
        reps, 
        duration_minutes, 
        weight_kg, 
        order_index,
        day_of_week 
    } = req.body;

    if (!exercise_id || !sets || !order_index) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: exercise_id, sets y order_index.' });
    }

    try {
        const routineCheck = await db.select({ id: routines.routine_id })
            .from(routines)
            .where(and(eq(routines.routine_id, routine_id), eq(routines.user_id, user_id)));

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }

        const newRoutineExercise = await db.insert(routineExercises).values({
            routine_id: routine_id,
            exercise_id: exercise_id,
            sets: sets,
            reps: reps || null, 
            duration_minutes: duration_minutes || null,
            weight_kg: weight_kg || 0,
            order_index: order_index,
            day_of_week: day_of_week !== undefined && day_of_week !== null ? parseInt(day_of_week) : null,
        }).returning();

        return res.status(201).json({
            message: 'Ejercicio añadido a la rutina con éxito.',
            routineExercise: newRoutineExercise[0]
        });

    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Este ejercicio ya está agregado a esta rutina.' });
        }
        logger.error('Error al vincular ejercicio a rutina:', { error: error.message, stack: error.stack, user_id, routine_id });
        return res.status(500).json({ error: 'Error interno del servidor al añadir el ejercicio a la rutina.' });
    }
});


// 🚨 NUEVA RUTA 🚨
// --- RUTA: DELETE /api/routines/:routineId/exercises/:routineExerciseId ---
// 7. Quitar un ejercicio específico de una rutina (usando routine_exercise_id para manejar días diferentes)
router.delete('/:routineId/exercises/:routineExerciseId', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const routine_id = parseInt(req.params.routineId);
    const routine_exercise_id = parseInt(req.params.routineExerciseId);

    try {
        // 1. Verificar la propiedad de la rutina (para evitar eliminar registros en rutinas ajenas)
        const routineCheck = await db.select({ id: routines.routine_id })
            .from(routines)
            .where(and(eq(routines.routine_id, routine_id), eq(routines.user_id, user_id)));

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada o no pertenece al usuario.' });
        }
        
        // 2. Verificar que el routine_exercise_id pertenece a esta rutina
        const exerciseCheck = await db.select()
            .from(routineExercises)
            .where(and(
                eq(routineExercises.routine_exercise_id, routine_exercise_id),
                eq(routineExercises.routine_id, routine_id)
            ));

        if (exerciseCheck.length === 0) {
            return res.status(404).json({ error: 'El ejercicio no está vinculado a esta rutina.' });
        }
        
        // 3. Eliminar el registro específico en la tabla routine_exercises
        const deletedExercise = await db.delete(routineExercises)
            .where(eq(routineExercises.routine_exercise_id, routine_exercise_id))
            .returning(); // Devolver el registro eliminado

        if (deletedExercise.length === 0) {
            return res.status(404).json({ error: 'No se pudo eliminar el ejercicio.' });
        }

        return res.status(200).json({
            message: 'Ejercicio eliminado de la rutina con éxito.',
            deletedExercise: deletedExercise[0]
        });

    } catch (error) {
        logger.error('Error al eliminar ejercicio de la rutina:', { error: error.message, stack: error.stack, user_id, routine_id });
        return res.status(500).json({ error: 'Error interno del servidor al eliminar el ejercicio.' });
    }
});


module.exports = router;