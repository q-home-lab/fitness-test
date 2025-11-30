/**
 * Test de Flujo de Onboarding
 * 
 * Prueba el flujo completo de onboarding:
 * 1. Registro de usuario (onboarding_completed = false por defecto)
 * 2. Verificar estado de onboarding
 * 3. Completar configuración inicial
 * 4. Verificar que onboarding está completado
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, dailyLogs, userGoals } = require('../db/schema');
const { eq, and } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Flujo de Onboarding', () => {
    let authToken;
    let userId;
    const testEmail = `onboarding-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Limpiar datos de prueba antes de comenzar
    beforeAll(async () => {
        const existingUsers = await db.select()
            .from(users)
            .where(eq(users.email, testEmail));
        
        for (const user of existingUsers) {
            // Limpiar en orden
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, user.user_id));
            for (const log of userLogs) {
                await db.delete(dailyLogs).where(eq(dailyLogs.log_id, log.log_id));
            }
            
            const userGoalsList = await db.select().from(userGoals).where(eq(userGoals.user_id, user.user_id));
            for (const goal of userGoalsList) {
                await db.delete(userGoals).where(eq(userGoals.goal_id, goal.goal_id));
            }
            
            await db.delete(users).where(eq(users.user_id, user.user_id));
        }
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        if (userId) {
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, userId));
            for (const log of userLogs) {
                await db.delete(dailyLogs).where(eq(dailyLogs.log_id, log.log_id));
            }
            
            const userGoalsList = await db.select().from(userGoals).where(eq(userGoals.user_id, userId));
            for (const goal of userGoalsList) {
                await db.delete(userGoals).where(eq(userGoals.goal_id, goal.goal_id));
            }
            
            await db.delete(users).where(eq(users.user_id, userId));
        }
    });

    describe('Paso 1: Registro de Usuario', () => {
        it('debería registrar un nuevo usuario con onboarding_completed = false', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            
            authToken = response.body.token;
            userId = response.body.user.id;

            // Verificar en la base de datos que onboarding_completed es false
            const userFromDb = await db.select()
                .from(users)
                .where(eq(users.user_id, userId))
                .limit(1);
            
            expect(userFromDb.length).toBe(1);
            expect(userFromDb[0].onboarding_completed).toBe(false);
            expect(userFromDb[0].onboarding_step).toBe(0);
        });
    });

    describe('Paso 2: Verificar Estado de Onboarding', () => {
        it('debería retornar el estado de onboarding correctamente', async () => {
            const response = await request(app)
                .get('/api/onboarding/status')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('onboarding_completed');
            expect(response.body).toHaveProperty('onboarding_step');
            expect(response.body).toHaveProperty('has_weight');
            expect(response.body).toHaveProperty('has_goal');
            
            expect(response.body.onboarding_completed).toBe(false);
            expect(response.body.onboarding_step).toBe(0);
            expect(response.body.has_weight).toBe(false);
            expect(response.body.has_goal).toBe(false);
        });
    });

    describe('Paso 3: Completar Configuración Inicial', () => {
        it('debería completar el onboarding con todos los datos requeridos', async () => {
            const response = await request(app)
                .post('/api/onboarding/initial-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gender: 'male',
                    age: 30,
                    height: 175,
                    initial_weight: 80,
                    target_weight: 75,
                    goal_type: 'weight_loss',
                    daily_calorie_goal: 2000,
                    activity_level: 'moderate'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('completada');
            
            // Verificar que se creó el log diario con peso
            const logs = await db.select()
                .from(dailyLogs)
                .where(eq(dailyLogs.user_id, userId));
            
            expect(logs.length).toBeGreaterThan(0);
            const todayLog = logs.find(log => {
                const logDate = new Date(log.date).toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];
                return logDate === today;
            });
            expect(todayLog).toBeDefined();
            expect(parseFloat(todayLog.weight)).toBe(80);

            // Verificar que se creó el objetivo
            const goals = await db.select()
                .from(userGoals)
                .where(and(
                    eq(userGoals.user_id, userId),
                    eq(userGoals.is_active, true)
                ));
            
            expect(goals.length).toBe(1);
            expect(parseFloat(goals[0].target_weight)).toBe(75);
            expect(goals[0].goal_type).toBe('weight_loss');
        });

        it('debería marcar onboarding como completado en la base de datos', async () => {
            const userFromDb = await db.select()
                .from(users)
                .where(eq(users.user_id, userId))
                .limit(1);
            
            expect(userFromDb.length).toBe(1);
            expect(userFromDb[0].onboarding_completed).toBe(true);
            expect(userFromDb[0].onboarding_step).toBe(4);
        });

        it('debería retornar has_weight y has_goal como true después de completar', async () => {
            const response = await request(app)
                .get('/api/onboarding/status')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.onboarding_completed).toBe(true);
            expect(response.body.onboarding_step).toBe(4);
            expect(response.body.has_weight).toBe(true);
            expect(response.body.has_goal).toBe(true);
        });
    });

    describe('Paso 4: Validaciones', () => {
        it('debería rechazar configuración inicial sin campos requeridos', async () => {
            const response = await request(app)
                .post('/api/onboarding/initial-setup')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gender: 'male',
                    // Faltan age, height, initial_weight
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});

