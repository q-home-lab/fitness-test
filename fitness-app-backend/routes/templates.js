const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');

const { users, routineTemplates, dietTemplates, clientRoutineAssignments } = schema;
const { eq, and, desc, asc } = require('drizzle-orm');

// Middleware para asegurar que el usuario es COACH o ADMIN
function ensureCoach(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado.' });
    }
    
    db.select({ role: users.role })
        .from(users)
        .where(eq(users.user_id, req.user.id))
        .limit(1)
        .then(([user]) => {
            if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN')) {
                return res.status(403).json({ error: 'Solo los entrenadores pueden acceder a esta ruta.' });
            }
            req.user.role = user.role;
            next();
        })
        .catch((error) => {
            logger.error('Error verificando rol de usuario:', { error: error.message });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        });
}

router.use(authenticateToken, ensureCoach);

// =================================================================
// ROUTINE TEMPLATES
// =================================================================

// GET /api/templates/routines - Obtener todas las plantillas de rutinas del coach
router.get('/routines', async (req, res) => {
    const coachId = req.user.id;

    try {
        const templates = await db
            .select()
            .from(routineTemplates)
            .where(eq(routineTemplates.coach_id, coachId))
            .orderBy(desc(routineTemplates.created_at));

        return res.status(200).json({
            message: 'Plantillas de rutinas obtenidas exitosamente.',
            templates,
        });
    } catch (error) {
        logger.error('Error obteniendo plantillas de rutinas:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/templates/routines/:id - Obtener una plantilla específica
router.get('/routines/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);

    try {
        const templates = await db
            .select()
            .from(routineTemplates)
            .where(and(
                eq(routineTemplates.template_id, templateId),
                eq(routineTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (templates.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        return res.status(200).json({
            message: 'Plantilla obtenida exitosamente.',
            template: templates[0],
        });
    } catch (error) {
        logger.error('Error obteniendo plantilla de rutina:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/templates/routines - Crear nueva plantilla de rutina
router.post('/routines', async (req, res) => {
    const coachId = req.user.id;
    const { name, description, exercises } = req.body;

    if (!name || !exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ error: 'Nombre y ejercicios son requeridos.' });
    }

    try {
        const newTemplate = await db
            .insert(routineTemplates)
            .values({
                coach_id: coachId,
                name,
                description: description || null,
                exercises: exercises,
            })
            .returning();

        return res.status(201).json({
            message: 'Plantilla de rutina creada exitosamente.',
            template: newTemplate[0],
        });
    } catch (error) {
        logger.error('Error creando plantilla de rutina:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/templates/routines/:id - Actualizar plantilla de rutina
router.put('/routines/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);
    const { name, description, exercises } = req.body;

    try {
        // Verificar que la plantilla pertenece al coach
        const existing = await db
            .select()
            .from(routineTemplates)
            .where(and(
                eq(routineTemplates.template_id, templateId),
                eq(routineTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        const updated = await db
            .update(routineTemplates)
            .set({
                name: name || existing[0].name,
                description: description !== undefined ? description : existing[0].description,
                exercises: exercises || existing[0].exercises,
                updated_at: new Date(),
            })
            .where(eq(routineTemplates.template_id, templateId))
            .returning();

        return res.status(200).json({
            message: 'Plantilla de rutina actualizada exitosamente.',
            template: updated[0],
        });
    } catch (error) {
        logger.error('Error actualizando plantilla de rutina:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// DELETE /api/templates/routines/:id - Eliminar plantilla de rutina
router.delete('/routines/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);

    try {
        // Verificar que la plantilla pertenece al coach
        const existing = await db
            .select()
            .from(routineTemplates)
            .where(and(
                eq(routineTemplates.template_id, templateId),
                eq(routineTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        await db
            .delete(routineTemplates)
            .where(eq(routineTemplates.template_id, templateId));

        return res.status(200).json({
            message: 'Plantilla de rutina eliminada exitosamente.',
        });
    } catch (error) {
        logger.error('Error eliminando plantilla de rutina:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// =================================================================
// DIET TEMPLATES
// =================================================================

// GET /api/templates/diets - Obtener todas las plantillas de dietas del coach
router.get('/diets', async (req, res) => {
    const coachId = req.user.id;

    try {
        const templates = await db
            .select()
            .from(dietTemplates)
            .where(eq(dietTemplates.coach_id, coachId))
            .orderBy(desc(dietTemplates.created_at));

        return res.status(200).json({
            message: 'Plantillas de dietas obtenidas exitosamente.',
            templates,
        });
    } catch (error) {
        logger.error('Error obteniendo plantillas de dietas:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/templates/diets/:id - Obtener una plantilla específica
router.get('/diets/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);

    try {
        const templates = await db
            .select()
            .from(dietTemplates)
            .where(and(
                eq(dietTemplates.template_id, templateId),
                eq(dietTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (templates.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        return res.status(200).json({
            message: 'Plantilla obtenida exitosamente.',
            template: templates[0],
        });
    } catch (error) {
        logger.error('Error obteniendo plantilla de dieta:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/templates/diets - Crear nueva plantilla de dieta
router.post('/diets', async (req, res) => {
    const coachId = req.user.id;
    const { name, description, meals, target_macros } = req.body;

    if (!name || !meals || !Array.isArray(meals)) {
        return res.status(400).json({ error: 'Nombre y comidas son requeridos.' });
    }

    try {
        const newTemplate = await db
            .insert(dietTemplates)
            .values({
                coach_id: coachId,
                name,
                description: description || null,
                meals: meals,
                target_macros: target_macros || null,
            })
            .returning();

        return res.status(201).json({
            message: 'Plantilla de dieta creada exitosamente.',
            template: newTemplate[0],
        });
    } catch (error) {
        logger.error('Error creando plantilla de dieta:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/templates/diets/:id - Actualizar plantilla de dieta
router.put('/diets/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);
    const { name, description, meals, target_macros } = req.body;

    try {
        const existing = await db
            .select()
            .from(dietTemplates)
            .where(and(
                eq(dietTemplates.template_id, templateId),
                eq(dietTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        const updated = await db
            .update(dietTemplates)
            .set({
                name: name || existing[0].name,
                description: description !== undefined ? description : existing[0].description,
                meals: meals || existing[0].meals,
                target_macros: target_macros !== undefined ? target_macros : existing[0].target_macros,
                updated_at: new Date(),
            })
            .where(eq(dietTemplates.template_id, templateId))
            .returning();

        return res.status(200).json({
            message: 'Plantilla de dieta actualizada exitosamente.',
            template: updated[0],
        });
    } catch (error) {
        logger.error('Error actualizando plantilla de dieta:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// DELETE /api/templates/diets/:id - Eliminar plantilla de dieta
router.delete('/diets/:id', async (req, res) => {
    const coachId = req.user.id;
    const templateId = parseInt(req.params.id);

    try {
        const existing = await db
            .select()
            .from(dietTemplates)
            .where(and(
                eq(dietTemplates.template_id, templateId),
                eq(dietTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        await db
            .delete(dietTemplates)
            .where(eq(dietTemplates.template_id, templateId));

        return res.status(200).json({
            message: 'Plantilla de dieta eliminada exitosamente.',
        });
    } catch (error) {
        logger.error('Error eliminando plantilla de dieta:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// =================================================================
// CLIENT ROUTINE ASSIGNMENTS
// =================================================================

// POST /api/templates/assign - Asignar rutina a cliente
router.post('/assign', async (req, res) => {
    const coachId = req.user.id;
    const { client_id, template_id, assigned_date, is_recurring, recurring_day } = req.body;

    if (!client_id || !template_id || !assigned_date) {
        return res.status(400).json({ error: 'client_id, template_id y assigned_date son requeridos.' });
    }

    try {
        // Verificar que el cliente pertenece al coach
        const client = await db
            .select()
            .from(users)
            .where(and(
                eq(users.user_id, client_id),
                eq(users.coach_id, coachId)
            ))
            .limit(1);

        if (client.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado o no tienes permisos.' });
        }

        // Verificar que la plantilla pertenece al coach
        const template = await db
            .select()
            .from(routineTemplates)
            .where(and(
                eq(routineTemplates.template_id, template_id),
                eq(routineTemplates.coach_id, coachId)
            ))
            .limit(1);

        if (template.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada.' });
        }

        const assignment = await db
            .insert(clientRoutineAssignments)
            .values({
                client_id,
                template_id,
                assigned_date,
                is_recurring: is_recurring || false,
                recurring_day: is_recurring ? recurring_day : null,
            })
            .returning();

        return res.status(201).json({
            message: 'Rutina asignada exitosamente.',
            assignment: assignment[0],
        });
    } catch (error) {
        logger.error('Error asignando rutina:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/templates/assignments/:clientId - Obtener asignaciones de un cliente
router.get('/assignments/:clientId', async (req, res) => {
    const coachId = req.user.id;
    const clientId = parseInt(req.params.clientId);

    try {
        // Verificar que el cliente pertenece al coach
        const client = await db
            .select()
            .from(users)
            .where(and(
                eq(users.user_id, clientId),
                eq(users.coach_id, coachId)
            ))
            .limit(1);

        if (client.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado o no tienes permisos.' });
        }

        const assignments = await db
            .select({
                assignment_id: clientRoutineAssignments.assignment_id,
                template_id: clientRoutineAssignments.template_id,
                assigned_date: clientRoutineAssignments.assigned_date,
                is_recurring: clientRoutineAssignments.is_recurring,
                recurring_day: clientRoutineAssignments.recurring_day,
                template_name: routineTemplates.name,
                template_exercises: routineTemplates.exercises,
            })
            .from(clientRoutineAssignments)
            .innerJoin(routineTemplates, eq(clientRoutineAssignments.template_id, routineTemplates.template_id))
            .where(eq(clientRoutineAssignments.client_id, clientId))
            .orderBy(asc(clientRoutineAssignments.assigned_date));

        return res.status(200).json({
            message: 'Asignaciones obtenidas exitosamente.',
            assignments,
        });
    } catch (error) {
        logger.error('Error obteniendo asignaciones:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

