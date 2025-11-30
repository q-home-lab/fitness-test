const express = require('express');
const router = express.Router();

const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');

const { inviteTokens } = schema;
const { eq, and, gt } = require('drizzle-orm');

// ---------------------------------------------------------------------------
// GET /api/invite/:token
// Valida un token de invitación y devuelve la información del coach y email
// ---------------------------------------------------------------------------
router.get('/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ error: 'Token de invitación requerido.' });
    }

    try {
        // Buscar el token en la base de datos
        const tokens = await db
            .select()
            .from(inviteTokens)
            .where(
                and(
                    eq(inviteTokens.token, token),
                    eq(inviteTokens.used, false),
                    gt(inviteTokens.expires_at, new Date())
                )
            )
            .limit(1);

        if (tokens.length === 0) {
            return res.status(404).json({ 
                error: 'Token de invitación inválido, ya utilizado o expirado.' 
            });
        }

        const inviteToken = tokens[0];

        return res.status(200).json({
            message: 'Token de invitación válido.',
            email: inviteToken.email,
            coachId: inviteToken.coach_id,
            expiresAt: inviteToken.expires_at,
        });

    } catch (error) {
        logger.error('Error validando token de invitación:', { error: error.message, stack: error.stack, token });
        return res.status(500).json({ error: 'Error interno del servidor al validar el token.' });
    }
});

module.exports = router;

