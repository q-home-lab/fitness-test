const express = require('express');
const router = express.Router();

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');

const { users, messages } = schema;
const { eq, and, or, desc, asc, sql } = require('drizzle-orm');

router.use(authenticateToken);

// POST /api/messages - Enviar mensaje
router.post('/', async (req, res) => {
    const senderId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content) {
        return res.status(400).json({ error: 'receiver_id y content son requeridos.' });
    }

    try {
        const newMessage = await db
            .insert(messages)
            .values({
                sender_id: senderId,
                receiver_id,
                content,
            })
            .returning();

        return res.status(201).json({
            message: 'Mensaje enviado exitosamente.',
            message: newMessage[0],
        });
    } catch (error) {
        logger.error('Error enviando mensaje:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/messages/conversation/:userId - Obtener conversación con un usuario
router.get('/conversation/:userId', async (req, res) => {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId);

    try {
        const conversation = await db
            .select()
            .from(messages)
            .where(
                or(
                    and(eq(messages.sender_id, currentUserId), eq(messages.receiver_id, otherUserId)),
                    and(eq(messages.sender_id, otherUserId), eq(messages.receiver_id, currentUserId))
                )
            )
            .orderBy(asc(messages.created_at));

        // Marcar mensajes como leídos
        await db
            .update(messages)
            .set({ is_read: true })
            .where(and(
                eq(messages.receiver_id, currentUserId),
                eq(messages.sender_id, otherUserId),
                eq(messages.is_read, false)
            ));

        return res.status(200).json({
            message: 'Conversación obtenida exitosamente.',
            messages: conversation,
        });
    } catch (error) {
        logger.error('Error obteniendo conversación:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// GET /api/messages/conversations - Obtener lista de conversaciones
router.get('/conversations', async (req, res) => {
    const userId = req.user.id;

    try {
        // Obtener últimos mensajes de cada conversación (versión simplificada)
        const allMessages = await db
            .select()
            .from(messages)
            .where(or(eq(messages.sender_id, userId), eq(messages.receiver_id, userId)))
            .orderBy(desc(messages.created_at));

        // Agrupar por usuario y obtener el último mensaje de cada conversación
        const conversationsMap = new Map();
        allMessages.forEach(msg => {
            const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            if (!conversationsMap.has(otherUserId) || new Date(msg.created_at) > new Date(conversationsMap.get(otherUserId).last_message_time)) {
                conversationsMap.set(otherUserId, {
                    other_user_id: otherUserId,
                    last_message: msg.content,
                    last_message_time: msg.created_at,
                });
            }
        });

        // Contar mensajes no leídos para cada conversación
        const conversations = Array.from(conversationsMap.values()).map(conv => {
            const unreadCount = allMessages.filter(
                msg => msg.receiver_id === userId && 
                       msg.sender_id === conv.other_user_id && 
                       !msg.is_read
            ).length;
            return { ...conv, unread_count: unreadCount };
        });

        return res.status(200).json({
            message: 'Conversaciones obtenidas exitosamente.',
            conversations,
        });
    } catch (error) {
        logger.error('Error obteniendo conversaciones:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

