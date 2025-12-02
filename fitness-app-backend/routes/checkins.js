const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');
const { handleValidationErrors, commonValidations } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');

const { users, checkIns } = schema;
const { eq, and, desc, asc } = require('drizzle-orm');

// POST /api/checkin - Crear o actualizar check-in semanal
router.post('/', 
    authenticateToken,
    [
        body('week_of')
            .notEmpty()
            .withMessage('week_of es requerido')
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage('week_of debe estar en formato YYYY-MM-DD'),
        body('weight')
            .optional()
            .isFloat({ min: 20, max: 300 })
            .withMessage('weight debe ser un número entre 20 y 300 kg'),
        body('feeling')
            .optional()
            .isIn(['excellent', 'good', 'ok', 'bad', 'terrible'])
            .withMessage('feeling debe ser uno de: excellent, good, ok, bad, terrible'),
        body('notes')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('notes no puede tener más de 2000 caracteres'),
        body('photo_front')
            .optional()
            .isURL()
            .withMessage('photo_front debe ser una URL válida'),
        body('photo_side')
            .optional()
            .isURL()
            .withMessage('photo_side debe ser una URL válida'),
        body('photo_back')
            .optional()
            .isURL()
            .withMessage('photo_back debe ser una URL válida'),
    ],
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { week_of, weight, feeling, notes, photo_front, photo_side, photo_back } = req.body;

        // Verificar si ya existe un check-in para esta semana
        const existing = await db
            .select()
            .from(checkIns)
            .where(and(
                eq(checkIns.client_id, userId),
                eq(checkIns.week_of, week_of)
            ))
            .limit(1);

        let result;
        if (existing.length > 0) {
            // Actualizar check-in existente
            result = await db
                .update(checkIns)
                .set({
                    weight: weight || existing[0].weight,
                    feeling: feeling || existing[0].feeling,
                    notes: notes !== undefined ? notes : existing[0].notes,
                    photo_front: photo_front || existing[0].photo_front,
                    photo_side: photo_side || existing[0].photo_side,
                    photo_back: photo_back || existing[0].photo_back,
                    updated_at: new Date(),
                })
                .where(eq(checkIns.check_in_id, existing[0].check_in_id))
                .returning();
        } else {
            // Crear nuevo check-in
            result = await db
                .insert(checkIns)
                .values({
                    client_id: userId,
                    week_of,
                    weight,
                    feeling,
                    notes,
                    photo_front,
                    photo_side,
                    photo_back,
                })
                .returning();
        }

        return res.status(200).json({
            message: 'Check-in guardado exitosamente.',
            checkIn: result[0],
        });
    })
);

// GET /api/checkin - Obtener check-ins del usuario
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const checkInsList = await db
            .select()
            .from(checkIns)
            .where(eq(checkIns.client_id, userId))
            .orderBy(desc(checkIns.week_of));

        return res.status(200).json({
            message: 'Check-ins obtenidos exitosamente.',
            checkIns: checkInsList,
        });
    } catch (error) {
        logger.error('Error obteniendo check-ins:', { error: error.message, stack: error.stack, userId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/checkin/client/:clientId - Obtener check-ins de un cliente (solo coach)
router.get('/client/:clientId', authenticateToken, async (req, res) => {
    const coachId = req.user.id;
    const clientId = parseInt(req.params.clientId);

    try {
        // Verificar que el usuario es coach y el cliente le pertenece
        const user = await db.select({ role: users.role }).from(users).where(eq(users.user_id, coachId)).limit(1);
        if (!user[0] || (user[0].role !== 'COACH' && user[0].role !== 'ADMIN')) {
            return res.status(403).json({ error: 'Solo los entrenadores pueden acceder a esta ruta.' });
        }

        const client = await db
            .select()
            .from(users)
            .where(and(
                eq(users.user_id, clientId),
                eq(users.coach_id, coachId)
            ))
            .limit(1);

        if (client.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        const checkInsList = await db
            .select()
            .from(checkIns)
            .where(eq(checkIns.client_id, clientId))
            .orderBy(desc(checkIns.week_of));

        return res.status(200).json({
            message: 'Check-ins obtenidos exitosamente.',
            checkIns: checkInsList,
        });
    } catch (error) {
        logger.error('Error obteniendo check-ins del cliente:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

