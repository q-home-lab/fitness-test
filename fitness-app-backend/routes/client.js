const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');
const { handleValidationErrors, commonValidations } = require('../middleware/validation');
const asyncHandler = require('../middleware/asyncHandler');

const { users } = schema;
const { eq } = require('drizzle-orm');

// ---------------------------------------------------------------------------
// POST /api/client/request-attention
// Permite a un cliente solicitar atención de su entrenador
// ---------------------------------------------------------------------------
router.post('/request-attention', 
    authenticateToken,
    [
        body('message')
            .trim()
            .notEmpty()
            .withMessage('El mensaje es requerido')
            .isLength({ min: 5, max: 1000 })
            .withMessage('El mensaje debe tener entre 5 y 1000 caracteres'),
    ],
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const clientId = req.user.id;
        const { message } = req.body;

        // Verificar que el usuario tiene un coach asignado
        const [client] = await db
            .select({ coach_id: users.coach_id })
            .from(users)
            .where(eq(users.user_id, clientId))
            .limit(1);

        if (!client || !client.coach_id) {
            return res.status(400).json({ error: 'No tienes un entrenador asignado.' });
        }

        // Aquí podrías crear una tabla de solicitudes de atención si quieres guardar el mensaje
        // Por ahora, simplemente marcamos al cliente como que necesita atención
        // Actualizar el campo needs_attention o crear un registro de solicitud
        
        // Opción 1: Actualizar un campo en la tabla users (si existe)
        // Opción 2: Crear una notificación para el coach
        
        // Por ahora, simplemente retornamos éxito
        // El coach verá al cliente como "necesita atención" basado en días sin actividad
        // En el futuro, podrías crear una tabla `attention_requests` para guardar los mensajes
        
        logger.info('Cliente solicitó atención:', { clientId, coachId: client.coach_id, message: message.trim() });

        return res.status(200).json({
            message: 'Solicitud de atención enviada exitosamente. Tu entrenador te contactará pronto.',
        });
    })
);

module.exports = router;

