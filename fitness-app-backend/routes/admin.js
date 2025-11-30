const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');

const { users, routines, routineExercises, exercises, userDailyMealPlans, dailyLogs, dailyExercises, mealItems, foods, userGoals } = schema;
const { eq, and, asc, desc, gte, lte, sql } = require('drizzle-orm');
const { generateAutoRoutine } = require('../utils/autoRoutineGenerator');
const { generateAutoMealPlan } = require('../utils/autoMealPlanGenerator');

// Middleware interno para asegurar que el usuario autenticado es admin
function ensureAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Solo los administradores pueden acceder a esta ruta.' });
    }
    next();
}

// Todas las rutas de este router requieren autenticación + rol administrador
router.use(authenticateToken, ensureAdmin);

// ---------------------------------------------------------------------------
// 1) Listado de usuarios para el panel de administración
// GET /api/admin/users
// ---------------------------------------------------------------------------
router.get('/users', async (req, res) => {
    try {
        const allUsers = await db
            .select({
                id: users.user_id,
                email: users.email,
                role: users.role,
                createdAt: users.created_at,
                onboardingCompleted: users.onboarding_completed,
                onboardingStep: users.onboarding_step,
            })
            .from(users)
            .orderBy(asc(users.user_id));

        return res.status(200).json({
            message: 'Listado de usuarios cargado correctamente.',
            users: allUsers,
        });
    } catch (error) {
        logger.error('Error al listar usuarios (admin):', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor al listar usuarios.' });
    }
});

// ---------------------------------------------------------------------------
// 2) Crear una rutina para un usuario concreto (como entrenador)
// POST /api/admin/users/:userId/routines
// ---------------------------------------------------------------------------
router.post('/users/:userId/routines', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre de la rutina es obligatorio.' });
    }

    try {
        const newRoutine = await db
            .insert(routines)
            .values({
                user_id: userId,
                name,
                description: description || null,
            })
            .returning({
                routine_id: routines.routine_id,
                name: routines.name,
                description: routines.description,
                is_active: routines.is_active,
            });

        return res.status(201).json({
            message: 'Rutina creada para el usuario con éxito.',
            routine: newRoutine[0],
        });
    } catch (error) {
        logger.error('Error al crear rutina para usuario (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ error: 'Error interno del servidor al crear rutina.' });
    }
});

// ---------------------------------------------------------------------------
// 3) Añadir ejercicios a una rutina de un usuario (modo entrenador)
// POST /api/admin/users/:userId/routines/:routineId/exercises
// body: { exercise_id, sets, reps, duration_minutes, weight_kg, order_index, day_of_week }
// ---------------------------------------------------------------------------
router.post('/users/:userId/routines/:routineId/exercises', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);

    const {
        exercise_id,
        sets,
        reps,
        duration_minutes,
        weight_kg,
        order_index,
        day_of_week,
    } = req.body;

    if (!exercise_id || !sets || !order_index) {
        return res
            .status(400)
            .json({ error: 'Faltan campos obligatorios: exercise_id, sets y order_index.' });
    }

    try {
        // Verificamos que la rutina pertenece al usuario indicado
        const routineCheck = await db
            .select({ id: routines.routine_id, ownerId: routines.user_id })
            .from(routines)
            .where(eq(routines.routine_id, routineId));

        if (routineCheck.length === 0 || routineCheck[0].ownerId !== userId) {
            return res
                .status(404)
                .json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        const newRoutineExercise = await db
            .insert(routineExercises)
            .values({
                routine_id: routineId,
                exercise_id,
                sets,
                reps: reps || null,
                duration_minutes: duration_minutes || null,
                weight_kg: weight_kg || 0,
                order_index,
                day_of_week:
                    day_of_week !== undefined && day_of_week !== null
                        ? parseInt(day_of_week, 10)
                        : null,
            })
            .returning();

        return res.status(201).json({
            message: 'Ejercicio añadido a la rutina del usuario con éxito.',
            routineExercise: newRoutineExercise[0],
        });
    } catch (error) {
        if (error.code === '23505') {
            // unique violation routine_id + exercise_id + day_of_week
            return res
                .status(409)
                .json({ error: 'Este ejercicio ya está agregado a esta rutina para ese día.' });
        }
        logger.error('Error al añadir ejercicio (admin):', { error: error.message, stack: error.stack, routineId, exerciseId });
        return res
            .status(500)
            .json({ error: 'Error interno del servidor al añadir ejercicio a la rutina.' });
    }
});

// ---------------------------------------------------------------------------
// 4) Obtener detalles de una rutina específica con sus ejercicios (admin)
// GET /api/admin/users/:userId/routines/:routineId
// ---------------------------------------------------------------------------
router.get('/users/:userId/routines/:routineId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);

    if (isNaN(userId) || isNaN(routineId)) {
        return res.status(400).json({ error: 'ID de usuario o rutina inválido.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db
            .select()
            .from(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .limit(1);

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        const routine = routineCheck[0];

        // Obtener ejercicios de la rutina
        const routineExercisesList = await db
            .select({
                routine_exercise_id: routineExercises.routine_exercise_id,
                exercise_id: exercises.exercise_id,
                exercise_name: exercises.name,
                category: exercises.category,
                sets: routineExercises.sets,
                reps: routineExercises.reps,
                duration_minutes: routineExercises.duration_minutes,
                weight_kg: routineExercises.weight_kg,
                order_index: routineExercises.order_index,
                day_of_week: routineExercises.day_of_week,
                gif_url: exercises.gif_url,
            })
            .from(routineExercises)
            .innerJoin(exercises, eq(routineExercises.exercise_id, exercises.exercise_id))
            .where(eq(routineExercises.routine_id, routineId))
            .orderBy(asc(routineExercises.day_of_week), asc(routineExercises.order_index));

        return res.status(200).json({
            message: 'Rutina cargada correctamente.',
            routine: {
                routine_id: routine.routine_id,
                name: routine.name,
                description: routine.description,
                is_active: routine.is_active,
                exercises: routineExercisesList,
            },
        });
    } catch (error) {
        logger.error('Error al obtener detalles de rutina (admin):', { error: error.message, stack: error.stack, routineId });
        return res.status(500).json({ error: 'Error interno del servidor al obtener la rutina.' });
    }
});

// ---------------------------------------------------------------------------
// 5) Actualizar una rutina (admin)
// PUT /api/admin/users/:userId/routines/:routineId
// body: { name, description, is_active }
// ---------------------------------------------------------------------------
router.put('/users/:userId/routines/:routineId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);
    const { name, description, is_active } = req.body;

    if (isNaN(userId) || isNaN(routineId)) {
        return res.status(400).json({ error: 'ID de usuario o rutina inválido.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db
            .select()
            .from(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .limit(1);

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar.' });
        }

        const updated = await db
            .update(routines)
            .set(updateData)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .returning();

        return res.status(200).json({
            message: 'Rutina actualizada correctamente.',
            routine: updated[0],
        });
    } catch (error) {
        logger.error('Error al actualizar rutina (admin):', { error: error.message, stack: error.stack, routineId });
        return res.status(500).json({ error: 'Error interno del servidor al actualizar la rutina.' });
    }
});

// ---------------------------------------------------------------------------
// 6) Eliminar una rutina (admin)
// DELETE /api/admin/users/:userId/routines/:routineId
// ---------------------------------------------------------------------------
router.delete('/users/:userId/routines/:routineId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);

    if (isNaN(userId) || isNaN(routineId)) {
        return res.status(400).json({ error: 'ID de usuario o rutina inválido.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db
            .select()
            .from(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .limit(1);

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        // Eliminar primero los ejercicios de la rutina
        await db
            .delete(routineExercises)
            .where(eq(routineExercises.routine_id, routineId));

        // Eliminar la rutina
        await db
            .delete(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)));

        return res.status(200).json({
            message: 'Rutina eliminada correctamente.',
        });
    } catch (error) {
        logger.error('Error al eliminar rutina (admin):', { error: error.message, stack: error.stack, routineId });
        return res.status(500).json({ error: 'Error interno del servidor al eliminar la rutina.' });
    }
});

// ---------------------------------------------------------------------------
// 7) Actualizar un ejercicio de una rutina (admin)
// PUT /api/admin/users/:userId/routines/:routineId/exercises/:routineExerciseId
// body: { sets, reps, duration_minutes, weight_kg, order_index, day_of_week }
// ---------------------------------------------------------------------------
router.put('/users/:userId/routines/:routineId/exercises/:routineExerciseId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);
    const routineExerciseId = parseInt(req.params.routineExerciseId, 10);

    const {
        sets,
        reps,
        duration_minutes,
        weight_kg,
        order_index,
        day_of_week,
    } = req.body;

    if (isNaN(userId) || isNaN(routineId) || isNaN(routineExerciseId)) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    if (!sets || !order_index) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: sets y order_index.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db
            .select()
            .from(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .limit(1);

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        // Verificar que el ejercicio pertenece a la rutina
        const exerciseCheck = await db
            .select()
            .from(routineExercises)
            .where(and(
                eq(routineExercises.routine_exercise_id, routineExerciseId),
                eq(routineExercises.routine_id, routineId)
            ))
            .limit(1);

        if (exerciseCheck.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado en la rutina.' });
        }

        // Preparar datos de actualización
        const updateData = {
            sets,
            order_index,
        };

        if (reps !== undefined) updateData.reps = reps || null;
        if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes || null;
        if (weight_kg !== undefined) updateData.weight_kg = weight_kg || 0;
        if (day_of_week !== undefined) {
            updateData.day_of_week = day_of_week !== null && day_of_week !== undefined
                ? parseInt(day_of_week, 10)
                : null;
        }

        // Actualizar el ejercicio
        const updated = await db
            .update(routineExercises)
            .set(updateData)
            .where(eq(routineExercises.routine_exercise_id, routineExerciseId))
            .returning();

        return res.status(200).json({
            message: 'Ejercicio actualizado correctamente.',
            routineExercise: updated[0],
        });
    } catch (error) {
        logger.error('Error al actualizar ejercicio de rutina (admin):', { error: error.message, stack: error.stack, routineExerciseId });
        return res.status(500).json({ error: 'Error interno del servidor al actualizar el ejercicio.' });
    }
});

// ---------------------------------------------------------------------------
// 8) Eliminar un ejercicio de una rutina (admin)
// DELETE /api/admin/users/:userId/routines/:routineId/exercises/:routineExerciseId
// ---------------------------------------------------------------------------
router.delete('/users/:userId/routines/:routineId/exercises/:routineExerciseId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const routineId = parseInt(req.params.routineId, 10);
    const routineExerciseId = parseInt(req.params.routineExerciseId, 10);

    if (isNaN(userId) || isNaN(routineId) || isNaN(routineExerciseId)) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    try {
        // Verificar que la rutina pertenece al usuario
        const routineCheck = await db
            .select()
            .from(routines)
            .where(and(eq(routines.routine_id, routineId), eq(routines.user_id, userId)))
            .limit(1);

        if (routineCheck.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada para el usuario especificado.' });
        }

        // Verificar que el ejercicio pertenece a la rutina
        const exerciseCheck = await db
            .select()
            .from(routineExercises)
            .where(and(
                eq(routineExercises.routine_exercise_id, routineExerciseId),
                eq(routineExercises.routine_id, routineId)
            ))
            .limit(1);

        if (exerciseCheck.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado en la rutina.' });
        }

        // Eliminar el ejercicio
        await db
            .delete(routineExercises)
            .where(eq(routineExercises.routine_exercise_id, routineExerciseId));

        return res.status(200).json({
            message: 'Ejercicio eliminado de la rutina correctamente.',
        });
    } catch (error) {
        logger.error('Error al eliminar ejercicio de rutina (admin):', { error: error.message, stack: error.stack, routineExerciseId });
        return res.status(500).json({ error: 'Error interno del servidor al eliminar el ejercicio.' });
    }
});

// ---------------------------------------------------------------------------
// 8) Definir/actualizar un plan de comidas semanal por usuario
// Tabla userDailyMealPlans: una fila por usuario y día de la semana (0-6)
// POST /api/admin/users/:userId/meal-plans/:dayOfWeek
// body: { breakfast, lunch, dinner, snacks }
// ---------------------------------------------------------------------------
router.post('/users/:userId/meal-plans/:dayOfWeek', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const dayOfWeek = parseInt(req.params.dayOfWeek, 10);

    if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res
            .status(400)
            .json({ error: 'dayOfWeek debe estar entre 0 (domingo) y 6 (sábado).' });
    }

    const { breakfast, lunch, dinner, snacks } = req.body;

    try {
        // UPSERT sencillo: intentar actualizar; si no existe, insertar
        const existing = await db
            .select()
            .from(userDailyMealPlans)
            .where(and(eq(userDailyMealPlans.user_id, userId), eq(userDailyMealPlans.day_of_week, dayOfWeek)));

        if (existing.length > 0) {
            const updated = await db
                .update(userDailyMealPlans)
                .set({
                    breakfast: breakfast ?? existing[0].breakfast,
                    lunch: lunch ?? existing[0].lunch,
                    dinner: dinner ?? existing[0].dinner,
                    snacks: snacks ?? existing[0].snacks,
                })
                .where(
                    and(
                        eq(userDailyMealPlans.user_id, userId),
                        eq(userDailyMealPlans.day_of_week, dayOfWeek)
                    )
                )
                .returning();

            return res.status(200).json({
                message: 'Plan de comidas actualizado correctamente.',
                plan: updated[0],
            });
        }

        const inserted = await db
            .insert(userDailyMealPlans)
            .values({
                user_id: userId,
                day_of_week: dayOfWeek,
                breakfast: breakfast || '',
                lunch: lunch || '',
                dinner: dinner || '',
                snacks: snacks || '',
            })
            .returning();

        return res.status(201).json({
            message: 'Plan de comidas creado correctamente.',
            plan: inserted[0],
        });
    } catch (error) {
        logger.error('Error al definir plan de comidas (admin):', { error: error.message, stack: error.stack, userId, dayOfWeek });
        return res
            .status(500)
            .json({ error: 'Error interno del servidor al definir el plan de comidas.' });
    }
});

// ---------------------------------------------------------------------------
// 5) Obtener el plan de comidas semanal de un usuario
// GET /api/admin/users/:userId/meal-plans
// ---------------------------------------------------------------------------
router.get('/users/:userId/meal-plans', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    try {
        const plans = await db
            .select()
            .from(userDailyMealPlans)
            .where(eq(userDailyMealPlans.user_id, userId))
            .orderBy(asc(userDailyMealPlans.day_of_week));

        return res.status(200).json({
            message: 'Plan de comidas semanal cargado correctamente.',
            plans,
        });
    } catch (error) {
        logger.error('Error al obtener plan de comidas (admin):', { error: error.message, stack: error.stack, userId, dayOfWeek });
        return res
            .status(500)
            .json({ error: 'Error interno del servidor al obtener el plan de comidas.' });
    }
});

// ---------------------------------------------------------------------------
// 6) Obtener las rutinas activas de un usuario (vista entrenador)
// GET /api/admin/users/:userId/routines
// ---------------------------------------------------------------------------
router.get('/users/:userId/routines', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    try {
        const userRoutines = await db
            .select()
            .from(routines)
            .where(eq(routines.user_id, userId))
            .orderBy(asc(routines.routine_id));

        return res.status(200).json({
            message: 'Rutinas del usuario cargadas correctamente.',
            routines: userRoutines,
        });
    } catch (error) {
        logger.error('Error al obtener rutinas del usuario (admin):', { error: error.message, stack: error.stack, userId });
        return res
            .status(500)
            .json({ error: 'Error interno del servidor al obtener las rutinas del usuario.' });
    }
});

// ---------------------------------------------------------------------------
// 7) Crear un nuevo usuario (admin)
// POST /api/admin/users
// body: { email, password, role (opcional: 'CLIENT', 'COACH', 'ADMIN') }
// ---------------------------------------------------------------------------
router.post('/users', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido.' });
    }

    // Validación básica de contraseña
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Validar rol si se proporciona
    const validRoles = ['CLIENT', 'COACH', 'ADMIN'];
    const userRole = role && validRoles.includes(role.toUpperCase()) 
        ? role.toUpperCase() 
        : 'CLIENT'; // Por defecto CLIENT

    try {
        // Verificar si el usuario ya existe
        const existingUsers = await db.select().from(users).where(eq(users.email, email));
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado.' });
        }

        // Hashear la contraseña
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear nuevo usuario con rol especificado
        const newUser = await db
            .insert(users)
            .values({
                email: email,
                password_hash: password_hash,
                role: userRole,
            })
            .returning({
                id: users.user_id,
                email: users.email,
                role: users.role,
                createdAt: users.created_at,
            });

        logger.info(`Usuario creado por admin: ${email} (rol: ${userRole})`);

        return res.status(201).json({
            message: `Usuario creado exitosamente como ${userRole}.`,
            user: newUser[0],
        });
    } catch (error) {
        logger.error('Error al crear usuario (admin):', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor al crear usuario.' });
    }
});

// ---------------------------------------------------------------------------
// 8) Actualizar un usuario (admin)
// PUT /api/admin/users/:userId
// body: { email, password (opcional), role (opcional: 'CLIENT', 'COACH', 'ADMIN') }
// ---------------------------------------------------------------------------
router.put('/users/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { email, password, role } = req.body;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    try {
        // Verificar que el usuario existe
        const existingUsers = await db.select().from(users).where(eq(users.user_id, userId));
        if (existingUsers.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const updateData = {};

        // Actualizar email si se proporciona
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'El formato del email no es válido.' });
            }

            // Verificar que el email no esté en uso por otro usuario
            const emailCheck = await db.select().from(users).where(eq(users.email, email));
            if (emailCheck.length > 0 && emailCheck[0].user_id !== userId) {
                return res.status(409).json({ error: 'El email ya está en uso por otro usuario.' });
            }

            updateData.email = email;
        }

        // Actualizar contraseña si se proporciona
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
            }
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            updateData.password_hash = await bcrypt.hash(password, saltRounds);
        }

        // Actualizar rol si se proporciona
        if (role) {
            const validRoles = ['CLIENT', 'COACH', 'ADMIN'];
            if (!validRoles.includes(role.toUpperCase())) {
                return res.status(400).json({ error: 'Rol inválido. Debe ser CLIENT, COACH o ADMIN.' });
            }
            updateData.role = role.toUpperCase();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
        }

        updateData.updated_at = new Date();

        const updated = await db
            .update(users)
            .set(updateData)
            .where(eq(users.user_id, userId))
            .returning({
                id: users.user_id,
                email: users.email,
                role: users.role,
                createdAt: users.created_at,
            });

        return res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            user: updated[0],
        });
    } catch (error) {
        logger.error('Error al actualizar usuario (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ error: 'Error interno del servidor al actualizar usuario.' });
    }
});

// ---------------------------------------------------------------------------
// 9) Eliminar un usuario (admin)
// DELETE /api/admin/users/:userId
// ---------------------------------------------------------------------------
router.delete('/users/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    try {
        // Verificar que el usuario existe
        const existingUsers = await db.select().from(users).where(eq(users.user_id, userId));
        if (existingUsers.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // No permitir eliminar al propio usuario admin
        if (req.user.id === userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
        }

        // Eliminar usuario (las foreign keys deberían estar configuradas con CASCADE o manejar manualmente)
        await db.delete(users).where(eq(users.user_id, userId));

        return res.status(200).json({
            message: 'Usuario eliminado exitosamente.',
        });
    } catch (error) {
        logger.error('Error al eliminar usuario (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ error: 'Error interno del servidor al eliminar usuario.' });
    }
});

// ---------------------------------------------------------------------------
// 10) Obtener estadísticas y seguimiento completo de un usuario
// GET /api/admin/users/:userId/stats
// ---------------------------------------------------------------------------
router.get('/users/:userId/stats', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    try {
        // Verificar que el usuario existe
        const userData = await db
            .select({
                user_id: users.user_id,
                email: users.email,
                gender: users.gender,
                age: users.age,
                height: users.height,
                created_at: users.created_at,
            })
            .from(users)
            .where(eq(users.user_id, userId))
            .limit(1);

        if (userData.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = userData[0];

        // Calcular fechas para análisis (últimos 30 días y últimos 7 días)
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const date30DaysAgo = thirtyDaysAgo.toISOString().split('T')[0];
        const date7DaysAgo = sevenDaysAgo.toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        // 1. Obtener objetivo del usuario
        const goals = await db
            .select()
            .from(userGoals)
            .where(and(eq(userGoals.user_id, userId), eq(userGoals.is_active, true)))
            .limit(1);

        const goal = goals.length > 0 ? goals[0] : null;

        // 2. Obtener logs de peso (últimos 30 días)
        const weightLogs = await db
            .select({
                date: dailyLogs.date,
                weight: dailyLogs.weight,
                consumed_calories: dailyLogs.consumed_calories,
                burned_calories: dailyLogs.burned_calories,
            })
            .from(dailyLogs)
            .where(and(eq(dailyLogs.user_id, userId), gte(dailyLogs.date, date30DaysAgo)))
            .orderBy(asc(dailyLogs.date));

        // 3. Calcular estadísticas de peso
        const weightStats = {
            current: weightLogs.length > 0 ? parseFloat(weightLogs[weightLogs.length - 1].weight) : null,
            initial: weightLogs.length > 0 ? parseFloat(weightLogs[0].weight) : null,
            change: null,
            changePercent: null,
            target: goal ? parseFloat(goal.target_weight) : null,
            progress: null, // % hacia el objetivo
            trend: 'stable', // 'increasing', 'decreasing', 'stable'
        };

        if (weightStats.current && weightStats.initial && weightStats.initial > 0) {
            weightStats.change = weightStats.current - weightStats.initial;
            weightStats.changePercent = ((weightStats.change / weightStats.initial) * 100).toFixed(2);
            
            if (goal) {
                const totalNeeded = parseFloat(goal.current_weight) - parseFloat(goal.target_weight);
                const achieved = parseFloat(goal.current_weight) - weightStats.current;
                if (totalNeeded !== 0 && isFinite(totalNeeded) && isFinite(achieved)) {
                    weightStats.progress = ((achieved / totalNeeded) * 100).toFixed(1);
                } else {
                    weightStats.progress = '0';
                }
            }

            // Determinar tendencia (últimos 7 días)
            const recentLogs = weightLogs.slice(-7);
            if (recentLogs.length >= 3) {
                const firstHalf = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
                const secondHalf = recentLogs.slice(Math.floor(recentLogs.length / 2));
                
                if (firstHalf.length > 0 && secondHalf.length > 0) {
                    const avgFirst = firstHalf.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0) / firstHalf.length;
                    const avgSecond = secondHalf.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0) / secondHalf.length;
                    const diff = avgSecond - avgFirst;
                    
                    if (!isNaN(diff) && isFinite(diff)) {
                        if (Math.abs(diff) < 0.1) {
                            weightStats.trend = 'stable';
                        } else if (diff > 0) {
                            weightStats.trend = 'increasing';
                        } else {
                            weightStats.trend = 'decreasing';
                        }
                    }
                }
            }
        }

        // 4. Estadísticas de ejercicio (últimos 30 días)
        const exerciseLogs = await db
            .select({
                date: dailyLogs.date,
                exercise_id: dailyExercises.exercise_id,
                exercise_name: exercises.name,
                sets_done: dailyExercises.sets_done,
                reps_done: dailyExercises.reps_done,
                duration_minutes: dailyExercises.duration_minutes,
                weight_kg: dailyExercises.weight_kg,
                burned_calories: dailyExercises.burned_calories,
            })
            .from(dailyExercises)
            .innerJoin(dailyLogs, eq(dailyExercises.log_id, dailyLogs.log_id))
            .innerJoin(exercises, eq(dailyExercises.exercise_id, exercises.exercise_id))
            .where(and(eq(dailyLogs.user_id, userId), gte(dailyLogs.date, date30DaysAgo)))
            .orderBy(desc(dailyLogs.date));

        const exerciseStats = {
            totalSessions: new Set(exerciseLogs.map(ex => ex.date)).size,
            totalExercises: exerciseLogs.length,
            totalCaloriesBurned: exerciseLogs.reduce((sum, ex) => sum + parseFloat(ex.burned_calories || 0), 0),
            averageCaloriesPerSession: 0,
            mostFrequentExercise: null,
            weeklyFrequency: 0, // días de ejercicio por semana
            adherence: 0, // % de días con ejercicio vs días esperados
        };

        if (exerciseStats.totalSessions > 0) {
            exerciseStats.averageCaloriesPerSession = (exerciseStats.totalCaloriesBurned / exerciseStats.totalSessions).toFixed(0);
            exerciseStats.weeklyFrequency = (exerciseStats.totalSessions / 4.3).toFixed(1); // 30 días ≈ 4.3 semanas
        }

        // Ejercicio más frecuente
        const exerciseCounts = {};
        exerciseLogs.forEach(ex => {
            const name = ex.exercise_name;
            exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
        });
        const mostFrequent = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];
        if (mostFrequent) {
            exerciseStats.mostFrequentExercise = {
                name: mostFrequent[0],
                count: mostFrequent[1],
            };
        }

        // Calcular adherencia (días con ejercicio / días totales)
        const totalDays = weightLogs.length;
        if (totalDays > 0) {
            exerciseStats.adherence = ((exerciseStats.totalSessions / totalDays) * 100).toFixed(1);
        }

        // 5. Estadísticas de nutrición (últimos 30 días)
        const mealLogs = await db
            .select({
                date: dailyLogs.date,
                consumed_calories: dailyLogs.consumed_calories,
                meal_type: mealItems.meal_type,
                food_name: foods.name,
                quantity_grams: mealItems.quantity_grams,
            })
            .from(mealItems)
            .innerJoin(dailyLogs, eq(mealItems.log_id, dailyLogs.log_id))
            .innerJoin(foods, eq(mealItems.food_id, foods.food_id))
            .where(and(eq(dailyLogs.user_id, userId), gte(dailyLogs.date, date30DaysAgo)))
            .orderBy(desc(dailyLogs.date));

        const nutritionStats = {
            totalCaloriesConsumed: weightLogs.reduce((sum, log) => sum + parseFloat(log.consumed_calories || 0), 0),
            averageCaloriesPerDay: 0,
            daysWithMeals: new Set(mealLogs.map(m => m.date)).size,
            mostConsumedFood: null,
            calorieGoal: goal ? parseFloat(goal.daily_calorie_goal) : null,
            calorieAdherence: 0, // % de días dentro del objetivo
        };

        const daysWithLogs = weightLogs.filter(log => parseFloat(log.consumed_calories) > 0).length;
        if (daysWithLogs > 0) {
            nutritionStats.averageCaloriesPerDay = (nutritionStats.totalCaloriesConsumed / daysWithLogs).toFixed(0);
        }

        // Alimento más consumido
        const foodCounts = {};
        mealLogs.forEach(meal => {
            const name = meal.food_name;
            foodCounts[name] = (foodCounts[name] || 0) + 1;
        });
        const mostConsumed = Object.entries(foodCounts).sort((a, b) => b[1] - a[1])[0];
        if (mostConsumed) {
            nutritionStats.mostConsumedFood = {
                name: mostConsumed[0],
                count: mostConsumed[1],
            };
        }

        // Calcular adherencia calórica
        if (nutritionStats.calorieGoal && daysWithLogs > 0) {
            const daysWithinGoal = weightLogs.filter(log => {
                const consumed = parseFloat(log.consumed_calories || 0);
                return consumed > 0 && Math.abs(consumed - nutritionStats.calorieGoal) <= (nutritionStats.calorieGoal * 0.1); // ±10%
            }).length;
            nutritionStats.calorieAdherence = ((daysWithinGoal / daysWithLogs) * 100).toFixed(1);
        }

        // 6. Resumen de actividad reciente (últimos 7 días) - MOVER ANTES DE RECOMENDACIONES
        const recentActivity = {
            daysWithExercise: new Set(
                exerciseLogs
                    .filter(ex => ex.date >= date7DaysAgo)
                    .map(ex => ex.date)
            ).size,
            daysWithMeals: new Set(
                mealLogs
                    .filter(m => m.date >= date7DaysAgo)
                    .map(m => m.date)
            ).size,
            averageCaloriesBurned: 0,
            averageCaloriesConsumed: 0,
        };

        const recentLogs = weightLogs.filter(log => log.date >= date7DaysAgo);
        if (recentLogs.length > 0) {
            recentActivity.averageCaloriesBurned = (
                recentLogs.reduce((sum, log) => sum + parseFloat(log.burned_calories || 0), 0) / recentLogs.length
            ).toFixed(0);
            recentActivity.averageCaloriesConsumed = (
                recentLogs.reduce((sum, log) => sum + parseFloat(log.consumed_calories || 0), 0) / recentLogs.length
            ).toFixed(0);
        }

        // 7. Recomendaciones basadas en evidencia científica
        const { generateScientificRecommendations } = require('../utils/scientificRecommendations');
        
        const recommendations = generateScientificRecommendations({
            user: {
                weight: weightStats.current || parseFloat(goal?.current_weight || 0),
                height: parseFloat(user.height || 0),
                age: user.age,
                gender: user.gender,
            },
            goal: goal ? {
                goalType: goal.goal_type,
                targetWeight: parseFloat(goal.target_weight),
                currentWeight: parseFloat(goal.current_weight),
                dailyCalorieGoal: parseFloat(goal.daily_calorie_goal),
            } : null,
            weightStats,
            exerciseStats,
            nutritionStats,
            recentActivity,
        });

        return res.status(200).json({
            message: 'Estadísticas del usuario cargadas correctamente.',
            user: {
                id: user.user_id,
                email: user.email,
                gender: user.gender,
                age: user.age,
                height: user.height,
                memberSince: user.created_at,
            },
            goal: goal ? {
                targetWeight: parseFloat(goal.target_weight),
                currentWeight: parseFloat(goal.current_weight),
                dailyCalorieGoal: parseFloat(goal.daily_calorie_goal),
                weeklyWeightChangeGoal: parseFloat(goal.weekly_weight_change_goal),
                goalType: goal.goal_type,
            } : null,
            weight: weightStats,
            exercise: exerciseStats,
            nutrition: nutritionStats,
            recentActivity,
            recommendations,
            weightHistory: weightLogs.map(log => ({
                date: log.date,
                weight: parseFloat(log.weight),
                consumed_calories: parseFloat(log.consumed_calories || 0),
                burned_calories: parseFloat(log.burned_calories || 0),
            })),
        });
    } catch (error) {
        logger.error('Error al obtener estadísticas del usuario (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas.' });
    }
});

// ---------------------------------------------------------------------------
// 11) Generar rutina automática de 5 días para un usuario
// POST /api/admin/users/:userId/generate-routine
// ---------------------------------------------------------------------------
router.post('/users/:userId/generate-routine', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    try {
        // Verificar que el usuario existe
        const userData = await db
            .select({
                user_id: users.user_id,
                email: users.email,
                gender: users.gender,
                age: users.age,
                height: users.height,
            })
            .from(users)
            .where(eq(users.user_id, userId))
            .limit(1);

        if (userData.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = userData[0];

        // Obtener objetivo del usuario
        const goals = await db
            .select()
            .from(userGoals)
            .where(and(eq(userGoals.user_id, userId), eq(userGoals.is_active, true)))
            .limit(1);

        const goal = goals.length > 0 ? {
            goalType: goals[0].goal_type,
            targetWeight: parseFloat(goals[0].target_weight),
            currentWeight: parseFloat(goals[0].current_weight),
            dailyCalorieGoal: parseFloat(goals[0].daily_calorie_goal),
        } : null;

        // Obtener ejercicios disponibles
        const availableExercises = await db
            .select()
            .from(exercises)
            .where(eq(exercises.is_public, true));

        if (availableExercises.length === 0) {
            return res.status(400).json({ error: 'No hay ejercicios disponibles en la base de datos.' });
        }

        // Generar rutina automática
        const generatedRoutine = generateAutoRoutine({
            availableExercises,
            goal,
            user: {
                weight: goal ? goal.currentWeight : parseFloat(user.height || 175) / 100 * 22, // Estimación si no hay peso
                height: parseFloat(user.height || 0),
                age: user.age,
                gender: user.gender,
            },
        });

        // Crear la rutina en la base de datos
        const newRoutine = await db
            .insert(routines)
            .values({
                user_id: userId,
                name: generatedRoutine.name,
                description: generatedRoutine.description,
                is_active: true,
            })
            .returning();

        const routineId = newRoutine[0].routine_id;

        // Agregar ejercicios a la rutina
        for (const day of generatedRoutine.days) {
            for (const exercise of day.exercises) {
                await db.insert(routineExercises).values({
                    routine_id: routineId,
                    exercise_id: exercise.exercise_id,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    duration_minutes: exercise.duration_minutes ? exercise.duration_minutes.toString() : null,
                    weight_kg: exercise.weight_kg.toString(),
                    order_index: exercise.order_index,
                    day_of_week: day.day_of_week,
                });
            }
        }

        return res.status(201).json({
            message: 'Rutina automática generada y creada exitosamente.',
            routine: {
                routine_id: routineId,
                name: generatedRoutine.name,
                description: generatedRoutine.description,
            },
            days: generatedRoutine.days.map(day => ({
                day_of_week: day.day_of_week,
                dayName: day.dayName,
                type: day.type,
                exercisesCount: day.exercises.length,
            })),
        });
    } catch (error) {
        logger.error('Error al generar rutina automática (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ 
            error: 'Error interno del servidor al generar la rutina.',
            details: error.message 
        });
    }
});

// ---------------------------------------------------------------------------
// 12) Generar plan de comidas automático de 7 días para un usuario
// POST /api/admin/users/:userId/generate-meal-plan
// ---------------------------------------------------------------------------
router.post('/users/:userId/generate-meal-plan', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    try {
        // Verificar que el usuario existe
        const userData = await db
            .select({
                user_id: users.user_id,
                email: users.email,
                gender: users.gender,
                age: users.age,
                height: users.height,
            })
            .from(users)
            .where(eq(users.user_id, userId))
            .limit(1);

        if (userData.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = userData[0];

        // Obtener objetivo del usuario
        const goals = await db
            .select()
            .from(userGoals)
            .where(and(eq(userGoals.user_id, userId), eq(userGoals.is_active, true)))
            .limit(1);

        const goal = goals.length > 0 ? {
            goalType: goals[0].goal_type,
            targetWeight: parseFloat(goals[0].target_weight),
            currentWeight: parseFloat(goals[0].current_weight),
            dailyCalorieGoal: parseFloat(goals[0].daily_calorie_goal),
        } : null;

        // Obtener alimentos disponibles
        const availableFoods = await db
            .select()
            .from(foods);

        if (availableFoods.length === 0) {
            return res.status(400).json({ error: 'No hay alimentos disponibles en la base de datos.' });
        }

        // Generar plan de comidas automático
        const generatedPlan = generateAutoMealPlan({
            availableFoods,
            goal,
            user: {
                weight: goal ? goal.currentWeight : parseFloat(user.height || 175) / 100 * 22,
                height: parseFloat(user.height || 0),
                age: user.age,
                gender: user.gender,
            },
        });

        // Guardar plan de comidas en la base de datos
        const savedPlans = [];
        for (const day of generatedPlan.days) {
            // Verificar si ya existe un plan para este día
            const existing = await db
                .select()
                .from(userDailyMealPlans)
                .where(and(
                    eq(userDailyMealPlans.user_id, userId),
                    eq(userDailyMealPlans.day_of_week, day.day_of_week)
                ));

            let plan;
            if (existing.length > 0) {
                // Actualizar plan existente
                plan = await db
                    .update(userDailyMealPlans)
                    .set({
                        breakfast: day.breakfast,
                        lunch: day.lunch,
                        dinner: day.dinner,
                        snacks: day.snacks,
                    })
                    .where(and(
                        eq(userDailyMealPlans.user_id, userId),
                        eq(userDailyMealPlans.day_of_week, day.day_of_week)
                    ))
                    .returning();
            } else {
                // Crear nuevo plan
                plan = await db
                    .insert(userDailyMealPlans)
                    .values({
                        user_id: userId,
                        day_of_week: day.day_of_week,
                        breakfast: day.breakfast,
                        lunch: day.lunch,
                        dinner: day.dinner,
                        snacks: day.snacks,
                    })
                    .returning();
            }

            savedPlans.push(plan[0]);
        }

        return res.status(201).json({
            message: 'Plan de comidas automático generado y guardado exitosamente.',
            plan: {
                name: generatedPlan.name,
                description: generatedPlan.description,
                dailyCalories: generatedPlan.dailyCalories,
                macros: generatedPlan.macros,
            },
            days: generatedPlan.days.map(day => ({
                day_of_week: day.day_of_week,
                dayName: day.dayName,
                breakfast: day.breakfast,
                lunch: day.lunch,
                dinner: day.dinner,
                snacks: day.snacks,
            })),
        });
    } catch (error) {
        logger.error('Error al generar plan de comidas automático (admin):', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ 
            error: 'Error interno del servidor al generar el plan de comidas.',
            details: error.message 
        });
    }
});

module.exports = router;


