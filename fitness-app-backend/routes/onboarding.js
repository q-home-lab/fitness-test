// /routes/onboarding.js
// Rutas para gestionar el proceso de onboarding

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');

const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { users, userGoals, dailyLogs } = schema;
const { eq, and } = require('drizzle-orm');
const { generateHealthRecommendations } = require('../utils/healthCalculations');
const logger = require('../utils/logger');

// GET /api/onboarding/status - Obtener estado del onboarding
router.get('/status', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const user = await db.select({
            onboarding_completed: users.onboarding_completed,
            onboarding_step: users.onboarding_step,
        })
        .from(users)
        .where(eq(users.user_id, user_id))
        .limit(1);

        if (user.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Verificar qué pasos se han completado realmente
        const hasWeight = await db.select({ log_id: dailyLogs.log_id })
            .from(dailyLogs)
            .where(eq(dailyLogs.user_id, user_id))
            .limit(1);

        const hasGoal = await db.select({ goal_id: userGoals.goal_id })
            .from(userGoals)
            .where(and(
                eq(userGoals.user_id, user_id),
                eq(userGoals.is_active, true)
            ))
            .limit(1);

        return res.status(200).json({
            onboarding_completed: user[0].onboarding_completed,
            onboarding_step: user[0].onboarding_step,
            has_weight: hasWeight.length > 0,
            has_goal: hasGoal.length > 0,
        });

    } catch (error) {
        logger.error('Error al obtener estado de onboarding:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/onboarding/update-step - Actualizar paso del onboarding
router.post('/update-step', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { step, completed } = req.body;

    try {
        const updateData = {};
        
        if (step !== undefined) {
            updateData.onboarding_step = parseInt(step);
        }
        
        if (completed !== undefined) {
            updateData.onboarding_completed = completed === true;
            if (completed) {
                updateData.onboarding_step = 4; // Marcar como completado
            }
        }

        updateData.updated_at = new Date();

        const updated = await db.update(users)
            .set(updateData)
            .where(eq(users.user_id, user_id))
            .returning();

        return res.status(200).json({
            message: 'Estado de onboarding actualizado.',
            user: {
                onboarding_completed: updated[0].onboarding_completed,
                onboarding_step: updated[0].onboarding_step,
            }
        });

    } catch (error) {
        logger.error('Error al actualizar estado de onboarding:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// POST /api/onboarding/initial-setup - Configuración inicial completa
router.post('/initial-setup', authenticateToken, async (req, res) => {
    const user_id = req.user.id;
    const { 
        initial_weight, 
        target_weight, 
        goal_type, 
        daily_calorie_goal,
        gender,
        age,
        height,
        activity_level
    } = req.body;

    try {
        // Validar campos requeridos
        if (!initial_weight || !gender || !age || !height) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos: peso inicial, género, edad y altura son obligatorios.' 
            });
        }

        // 1. Guardar datos personales del usuario
        await db.update(users)
            .set({
                gender: gender,
                age: parseInt(age),
                height: parseFloat(height),
                updated_at: new Date(),
            })
            .where(eq(users.user_id, user_id));

        // 2. Calcular recomendaciones personalizadas
        const recommendations = generateHealthRecommendations({
            weight: parseFloat(initial_weight),
            height: parseFloat(height),
            age: parseInt(age),
            gender: gender,
            goalType: goal_type || 'maintain',
            activityLevel: activity_level || 'moderate'
        });

        // 3. Usar peso objetivo recomendado si no se proporciona uno
        const finalTargetWeight = target_weight 
            ? parseFloat(target_weight) 
            : (recommendations?.target?.recommendedWeight || parseFloat(initial_weight));

        // 4. Usar calorías recomendadas si no se proporcionan
        const finalCalorieGoal = daily_calorie_goal 
            ? parseFloat(daily_calorie_goal) 
            : (recommendations?.target?.recommendedCalories || 2000);

        // 5. Crear registro de peso inicial (si no existe)
        const today = new Date().toISOString().split('T')[0];
        const existingLog = await db.select({ log_id: dailyLogs.log_id })
            .from(dailyLogs)
            .where(and(
                eq(dailyLogs.user_id, user_id),
                eq(dailyLogs.date, today)
            ))
            .limit(1);

        if (existingLog.length === 0) {
            await db.insert(dailyLogs).values({
                user_id: user_id,
                date: today,
                weight: parseFloat(initial_weight),
                consumed_calories: 0,
                burned_calories: 0,
            });
        } else {
            await db.update(dailyLogs)
                .set({ weight: parseFloat(initial_weight) })
                .where(eq(dailyLogs.log_id, existingLog[0].log_id));
        }

        // 6. Crear objetivo (si no existe o actualizar)
        const existingGoal = await db.select({ goal_id: userGoals.goal_id })
            .from(userGoals)
            .where(and(
                eq(userGoals.user_id, user_id),
                eq(userGoals.is_active, true)
            ))
            .limit(1);

        const finalGoalType = goal_type || 'maintain';

        if (existingGoal.length === 0) {
            await db.insert(userGoals).values({
                user_id: user_id,
                target_weight: finalTargetWeight,
                current_weight: parseFloat(initial_weight),
                daily_calorie_goal: finalCalorieGoal,
                goal_type: finalGoalType,
                weekly_weight_change_goal: finalGoalType === 'weight_loss' ? -0.5 : finalGoalType === 'weight_gain' ? 0.5 : 0,
                is_active: true,
            });
        } else {
            await db.update(userGoals)
                .set({
                    target_weight: finalTargetWeight,
                    current_weight: parseFloat(initial_weight),
                    daily_calorie_goal: finalCalorieGoal,
                    goal_type: finalGoalType,
                    updated_at: new Date(),
                })
                .where(eq(userGoals.goal_id, existingGoal[0].goal_id));
        }

        // 7. Marcar onboarding como completado
        await db.update(users)
            .set({
                onboarding_completed: true,
                onboarding_step: 4,
                updated_at: new Date(),
            })
            .where(eq(users.user_id, user_id));

        return res.status(200).json({
            message: 'Configuración inicial completada con éxito.',
            recommendations: recommendations
        });

    } catch (error) {
        logger.error('Error al completar configuración inicial:', { error: error.message, stack: error.stack, user_id });
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;

