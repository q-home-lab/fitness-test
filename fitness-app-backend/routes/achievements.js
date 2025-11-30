// /routes/achievements.js
// Rutas para el sistema de logros/badges

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { achievements, userAchievements } = schema;
const { eq, and, desc, sql } = require('drizzle-orm');
const logger = require('../utils/logger');

// Middleware de autenticación global
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// GET /api/achievements
// Obtener todos los logros disponibles
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const allAchievements = await db.select()
            .from(achievements)
            .orderBy(desc(achievements.achievement_id));

        return res.status(200).json({
            message: 'Logros cargados correctamente.',
            achievements: allAchievements
        });
    } catch (error) {
        logger.error('Error al obtener logros:', { error: error.message, stack: error.stack });
        return res.status(500).json({ error: 'Error interno del servidor al obtener logros.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/achievements/user
// Obtener logros del usuario actual
// ---------------------------------------------------------------------------
router.get('/user', async (req, res) => {
    const user_id = req.user.id;

    try {
        const userAchievementsList = await db.select({
            achievement_id: achievements.achievement_id,
            name: achievements.name,
            description: achievements.description,
            icon: achievements.icon,
            category: achievements.category,
            rarity: achievements.rarity,
            unlocked_at: userAchievements.unlocked_at,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievement_id, achievements.achievement_id))
        .where(eq(userAchievements.user_id, user_id))
        .orderBy(desc(userAchievements.unlocked_at));

        // Obtener todos los logros para mostrar cuáles están desbloqueados
        const allAchievements = await db.select()
            .from(achievements)
            .orderBy(desc(achievements.achievement_id));

        const unlockedIds = new Set(userAchievementsList.map(ua => ua.achievement_id));

        return res.status(200).json({
            message: 'Logros del usuario cargados correctamente.',
            userAchievements: userAchievementsList,
            allAchievements: allAchievements.map(ach => ({
                ...ach,
                unlocked: unlockedIds.has(ach.achievement_id),
                unlocked_at: userAchievementsList.find(ua => ua.achievement_id === ach.achievement_id)?.unlocked_at || null
            }))
        });
    } catch (error) {
        logger.error('Error al obtener logros del usuario:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor al obtener logros del usuario.' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/achievements/unlock
// Desbloquear un logro para el usuario (usado internamente por el sistema)
// body: { achievement_id }
// ---------------------------------------------------------------------------
router.post('/unlock', async (req, res) => {
    const user_id = req.user.id;
    const { achievement_id } = req.body;

    if (!achievement_id) {
        return res.status(400).json({ error: 'achievement_id es requerido.' });
    }

    try {
        // Verificar que el logro existe
        const achievement = await db.select()
            .from(achievements)
            .where(eq(achievements.achievement_id, achievement_id))
            .limit(1);

        if (achievement.length === 0) {
            return res.status(404).json({ error: 'Logro no encontrado.' });
        }

        // Verificar si ya está desbloqueado
        const existing = await db.select()
            .from(userAchievements)
            .where(and(
                eq(userAchievements.user_id, user_id),
                eq(userAchievements.achievement_id, achievement_id)
            ))
            .limit(1);

        if (existing.length > 0) {
            return res.status(200).json({
                message: 'Logro ya estaba desbloqueado.',
                userAchievement: existing[0]
            });
        }

        // Desbloquear el logro
        const newUserAchievement = await db.insert(userAchievements)
            .values({
                user_id,
                achievement_id
            })
            .returning();

        return res.status(201).json({
            message: 'Logro desbloqueado correctamente.',
            userAchievement: newUserAchievement[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este logro ya está desbloqueado.' });
        }
        logger.error('Error al desbloquear logro:', { error: error.message, stack: error.stack, user_id, achievement_id });
        return res.status(500).json({ error: 'Error interno del servidor al desbloquear logro.' });
    }
});

module.exports = router;

