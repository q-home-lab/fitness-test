// /routes/notifications.js
// Rutas para el sistema de notificaciones

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { notifications } = schema;
const { eq, and, desc, sql } = require('drizzle-orm');
const logger = require('../utils/logger');

// Middleware de autenticación global
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GET /api/notifications
// Obtener todas las notificaciones del usuario (con paginación)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    try {
        let query = db.select()
            .from(notifications)
            .where(eq(notifications.user_id, user_id));

        if (unreadOnly) {
            query = query.where(and(
                eq(notifications.user_id, user_id),
                eq(notifications.is_read, false)
            ));
        }

        const userNotifications = await query
            .orderBy(desc(notifications.created_at))
            .limit(limit)
            .offset(offset);

        // Contar total
        const totalResult = await db.select({
            count: sql`count(*)`.as('count')
        })
        .from(notifications)
        .where(unreadOnly 
            ? and(eq(notifications.user_id, user_id), eq(notifications.is_read, false))
            : eq(notifications.user_id, user_id)
        );

        const total = parseInt(totalResult[0]?.count || 0);
        const unreadCount = await db.select({
            count: sql`count(*)`.as('count')
        })
        .from(notifications)
        .where(and(eq(notifications.user_id, user_id), eq(notifications.is_read, false)));

        return res.status(200).json({
            message: 'Notificaciones cargadas correctamente.',
            notifications: userNotifications,
            unreadCount: parseInt(unreadCount[0]?.count || 0),
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
        logger.error('Error al obtener notificaciones:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al obtener notificaciones.' });
    }
});

// ---------------------------------------------------------------------------
// PUT /api/notifications/:notificationId/read
// Marcar notificación como leída
// ---------------------------------------------------------------------------
router.put('/:notificationId/read', async (req, res) => {
    const user_id = req.user.id;
    const notificationId = parseInt(req.params.notificationId);

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'ID de notificación inválido.' });
    }

    try {
        // Verificar que la notificación pertenece al usuario
        const notification = await db.select()
            .from(notifications)
            .where(and(
                eq(notifications.notification_id, notificationId),
                eq(notifications.user_id, user_id)
            ))
            .limit(1);

        if (notification.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada.' });
        }

        // Marcar como leída
        const updated = await db.update(notifications)
            .set({ is_read: true })
            .where(and(
                eq(notifications.notification_id, notificationId),
                eq(notifications.user_id, user_id)
            ))
            .returning();

        return res.status(200).json({
            message: 'Notificación marcada como leída.',
            notification: updated[0]
        });
    } catch (error) {
        logger.error('Error al marcar notificación como leída:', { error: error.message, stack: error.stack, user_id, notificationId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------------------------------------------------------------------------
// PUT /api/notifications/read-all
// Marcar todas las notificaciones como leídas
// ---------------------------------------------------------------------------
router.put('/read-all', async (req, res) => {
    const user_id = req.user.id;

    try {
        await db.update(notifications)
            .set({ is_read: true })
            .where(and(
                eq(notifications.user_id, user_id),
                eq(notifications.is_read, false)
            ));

        return res.status(200).json({
            message: 'Todas las notificaciones marcadas como leídas.'
        });
    } catch (error) {
        logger.error('Error al marcar todas las notificaciones como leídas:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/notifications/:notificationId
// Eliminar notificación
// ---------------------------------------------------------------------------
router.delete('/:notificationId', async (req, res) => {
    const user_id = req.user.id;
    const notificationId = parseInt(req.params.notificationId);

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'ID de notificación inválido.' });
    }

    try {
        // Verificar que la notificación pertenece al usuario
        const notification = await db.select()
            .from(notifications)
            .where(and(
                eq(notifications.notification_id, notificationId),
                eq(notifications.user_id, user_id)
            ))
            .limit(1);

        if (notification.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada.' });
        }

        await db.delete(notifications)
            .where(and(
                eq(notifications.notification_id, notificationId),
                eq(notifications.user_id, user_id)
            ));

        return res.status(200).json({
            message: 'Notificación eliminada correctamente.'
        });
    } catch (error) {
        logger.error('Error al eliminar notificación:', { error: error.message, stack: error.stack, user_id, notificationId });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

