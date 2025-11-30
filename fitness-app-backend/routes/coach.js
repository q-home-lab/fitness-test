const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const logger = require('../utils/logger');

const { users, inviteTokens, dailyLogs, userGoals, dailyExercises, mealItems } = schema;
const { eq, and, gt, desc, sql, gte, lte, asc } = require('drizzle-orm');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

// Middleware para asegurar que el usuario es COACH o ADMIN
function ensureCoach(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado.' });
    }
    
    // Obtener el rol del usuario desde la base de datos
    // Nota: req.user.role debería estar en el token, pero lo verificamos en la DB por seguridad
    db.select({ role: users.role })
        .from(users)
        .where(eq(users.user_id, req.user.id))
        .limit(1)
        .then(([user]) => {
            if (!user || (user.role !== 'COACH' && user.role !== 'ADMIN')) {
                return res.status(403).json({ error: 'Solo los entrenadores pueden acceder a esta ruta.' });
            }
            req.user.role = user.role; // Añadir el rol al objeto req.user
            next();
        })
        .catch((error) => {
            logger.error('Error verificando rol de usuario:', { error: error.message });
            return res.status(500).json({ error: 'Error interno del servidor.' });
        });
}

// Helper para crear transporte de email
function createEmailTransport() {
    if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
        return {
            sendMail: async (options) => {
                logger.info('Email simulado (test/dev):', options);
                return { messageId: 'test-message-id' };
            }
        };
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

const mailTransport = createEmailTransport();

// Todas las rutas de este router requieren autenticación + rol COACH o ADMIN
router.use(authenticateToken, ensureCoach);

// ---------------------------------------------------------------------------
// POST /api/coach/invite
// Crea un token de invitación y envía un email al cliente
// ---------------------------------------------------------------------------
router.post('/invite', async (req, res) => {
    const { email } = req.body;
    const coachId = req.user.id;

    // Validación básica
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email inválido.' });
    }

    try {
        // Verificar si el email ya está registrado
        const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Este email ya está registrado.' });
        }

        // Generar token único
        const token = crypto.randomBytes(32).toString('hex');
        
        // Fecha de expiración: 7 días desde ahora
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Guardar token en la base de datos
        await db.insert(inviteTokens).values({
            coach_id: coachId,
            email: email,
            token: token,
            expires_at: expiresAt,
            used: false,
        });

        // Generar enlace de invitación
        const inviteLink = `${FRONTEND_BASE_URL}/invite/${token}`;

        // Enviar email de invitación
        try {
            await mailTransport.sendMail({
                from: process.env.SMTP_FROM || 'noreply@fitnessapp.com',
                to: email,
                subject: 'Invitación para unirte a Fitness App',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #FF5A1F;">¡Has sido invitado!</h2>
                        <p>Has recibido una invitación para unirte a Fitness App como cliente.</p>
                        <p>Haz clic en el siguiente enlace para completar tu registro:</p>
                        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #FF5A1F; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                            Aceptar Invitación
                        </a>
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            Este enlace expirará en 7 días. Si no solicitaste esta invitación, puedes ignorar este email.
                        </p>
                    </div>
                `,
                text: `Has recibido una invitación para unirte a Fitness App. Visita: ${inviteLink}`,
            });

            logger.info(`Invitación enviada a ${email} por coach ${coachId}`);
        } catch (emailError) {
            logger.error('Error enviando email de invitación:', { error: emailError.message });
            // No fallamos la petición si el email falla, pero lo registramos
        }

        return res.status(201).json({
            message: 'Invitación creada y enviada exitosamente.',
            inviteLink: inviteLink, // Devolvemos el enlace por si acaso
        });

    } catch (error) {
        logger.error('Error creando invitación:', { error: error.message, stack: error.stack, coachId, email });
        return res.status(500).json({ error: 'Error interno del servidor al crear la invitación.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/coach/clients
// Obtiene todos los clientes del coach con métricas
// ---------------------------------------------------------------------------
router.get('/clients', async (req, res) => {
    const coachId = req.user.id;

    try {
        // Obtener todos los clientes del coach
        const clients = await db
            .select({
                id: users.user_id,
                email: users.email,
                created_at: users.created_at,
            })
            .from(users)
            .where(eq(users.coach_id, coachId))
            .orderBy(desc(users.created_at));

        // Para cada cliente, obtener métricas adicionales
        const clientsWithMetrics = await Promise.all(
            clients.map(async (client) => {
                // Obtener el último registro de peso
                const lastWeightLog = await db
                    .select({
                        weight: dailyLogs.weight,
                        date: dailyLogs.date,
                    })
                    .from(dailyLogs)
                    .where(eq(dailyLogs.user_id, client.id))
                    .orderBy(desc(dailyLogs.date))
                    .limit(1);

                const currentWeight = lastWeightLog.length > 0 ? parseFloat(lastWeightLog[0].weight) : null;
                const lastWeightDate = lastWeightLog.length > 0 ? lastWeightLog[0].date : null;

                // Obtener el objetivo activo
                const activeGoal = await db
                    .select({
                        target_weight: userGoals.target_weight,
                        goal_type: userGoals.goal_type,
                    })
                    .from(userGoals)
                    .where(and(
                        eq(userGoals.user_id, client.id),
                        eq(userGoals.is_active, true)
                    ))
                    .limit(1);

                const targetWeight = activeGoal.length > 0 ? parseFloat(activeGoal[0].target_weight) : null;
                const goalType = activeGoal.length > 0 ? activeGoal[0].goal_type : null;

                // Calcular % cumplimiento última semana
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const weekStart = oneWeekAgo.toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];

                const weekLogs = await db
                    .select()
                    .from(dailyLogs)
                    .where(and(
                        eq(dailyLogs.user_id, client.id),
                        gte(dailyLogs.date, weekStart),
                        lte(dailyLogs.date, today)
                    ));

                // Contar días con ejercicios completados
                const daysWithExercises = await db
                    .select({ date: dailyLogs.date })
                    .from(dailyLogs)
                    .innerJoin(dailyExercises, eq(dailyLogs.log_id, dailyExercises.log_id))
                    .where(and(
                        eq(dailyLogs.user_id, client.id),
                        gte(dailyLogs.date, weekStart),
                        lte(dailyLogs.date, today)
                    ))
                    .groupBy(dailyLogs.date);

                const completionRate = weekLogs.length > 0 
                    ? Math.round((daysWithExercises.length / 7) * 100) 
                    : 0;

                // Última conexión (último log creado o actualizado)
                const lastActivity = await db
                    .select({
                        updated_at: dailyLogs.updated_at,
                        created_at: dailyLogs.created_at,
                    })
                    .from(dailyLogs)
                    .where(eq(dailyLogs.user_id, client.id))
                    .orderBy(desc(dailyLogs.updated_at))
                    .limit(1);

                const lastConnection = lastActivity.length > 0 
                    ? (lastActivity[0].updated_at || lastActivity[0].created_at)
                    : client.created_at;

                // Calcular días sin actividad
                const daysSinceActivity = lastConnection 
                    ? Math.floor((new Date() - new Date(lastConnection)) / (1000 * 60 * 60 * 24))
                    : 999;

                return {
                    ...client,
                    currentWeight,
                    targetWeight,
                    goalType,
                    completionRate,
                    lastConnection,
                    daysSinceActivity,
                    needsAttention: daysSinceActivity > 4, // Más de 4 días sin actividad
                };
            })
        );

        return res.status(200).json({
            message: 'Clientes obtenidos exitosamente.',
            clients: clientsWithMetrics,
        });

    } catch (error) {
        logger.error('Error obteniendo clientes:', { error: error.message, stack: error.stack, coachId });
        return res.status(500).json({ error: 'Error interno del servidor al obtener clientes.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/coach/clients/:clientId
// Obtiene el detalle completo de un cliente
// ---------------------------------------------------------------------------
router.get('/clients/:clientId', async (req, res) => {
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
            return res.status(404).json({ error: 'Cliente no encontrado o no tienes permisos para verlo.' });
        }

        // Obtener histórico de pesos
        const weightHistory = await db
            .select({
                date: dailyLogs.date,
                weight: dailyLogs.weight,
            })
            .from(dailyLogs)
            .where(eq(dailyLogs.user_id, clientId))
            .orderBy(asc(dailyLogs.date));

        // Obtener objetivos
        const goals = await db
            .select()
            .from(userGoals)
            .where(eq(userGoals.user_id, clientId))
            .orderBy(desc(userGoals.created_at));

        // Obtener rutinas asignadas (si existen)
        // TODO: Esto se implementará en Sprint 3

        // Obtener check-ins (si existen)
        // TODO: Esto se implementará en Sprint 4

        // Obtener últimos logs con ejercicios y comidas
        const recentLogs = await db
            .select({
                log_id: dailyLogs.log_id,
                date: dailyLogs.date,
                weight: dailyLogs.weight,
                consumed_calories: dailyLogs.consumed_calories,
                burned_calories: dailyLogs.burned_calories,
            })
            .from(dailyLogs)
            .where(eq(dailyLogs.user_id, clientId))
            .orderBy(desc(dailyLogs.date))
            .limit(30);

        // Para cada log, obtener ejercicios y comidas
        const logsWithDetails = await Promise.all(
            recentLogs.map(async (log) => {
                const exercises = await db
                    .select({
                        exercise_id: dailyExercises.exercise_id,
                        sets_done: dailyExercises.sets_done,
                        reps_done: dailyExercises.reps_done,
                        duration_minutes: dailyExercises.duration_minutes,
                        weight_kg: dailyExercises.weight_kg,
                        burned_calories: dailyExercises.burned_calories,
                    })
                    .from(dailyExercises)
                    .where(eq(dailyExercises.log_id, log.log_id));

                const meals = await db
                    .select({
                        meal_item_id: mealItems.meal_item_id,
                        quantity_grams: mealItems.quantity_grams,
                        meal_type: mealItems.meal_type,
                        consumed_calories: mealItems.consumed_calories,
                    })
                    .from(mealItems)
                    .where(eq(mealItems.log_id, log.log_id));

                return {
                    ...log,
                    exercises,
                    meals,
                };
            })
        );

        return res.status(200).json({
            message: 'Detalle del cliente obtenido exitosamente.',
            client: {
                id: client[0].user_id,
                email: client[0].email,
                created_at: client[0].created_at,
            },
            weightHistory,
            goals,
            recentLogs: logsWithDetails,
        });

    } catch (error) {
        logger.error('Error obteniendo detalle del cliente:', { error: error.message, stack: error.stack, coachId, clientId });
        return res.status(500).json({ error: 'Error interno del servidor al obtener el detalle del cliente.' });
    }
});

module.exports = router;

