const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, dailyLogs, mealItems } = require('../db/schema');
const { eq, and } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Logs Routes', () => {
    let authToken;
    let userId;
    let testDate;

    beforeAll(async () => {
        // Usar fecha de hoy para evitar conflictos
        testDate = new Date().toISOString().split('T')[0];
        
        // Limpiar usuario de prueba si existe
        const existingUsers = await db.select().from(users).where(eq(users.email, 'logs-test@example.com'));
        for (const user of existingUsers) {
            // Buscar y eliminar logs del usuario
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, user.user_id));
            for (const log of userLogs) {
                await db.delete(mealItems).where(eq(mealItems.log_id, log.log_id));
            }
            await db.delete(dailyLogs).where(eq(dailyLogs.user_id, user.user_id));
            await db.delete(users).where(eq(users.user_id, user.user_id));
        }
        
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'logs-test@example.com',
            password_hash: passwordHash
        }).returning();
        userId = result[0].user_id;

        authToken = jwt.sign(
            { id: userId, email: result[0].email },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        try {
            // Primero eliminar mealItems asociados
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, userId));
            for (const log of userLogs) {
                await db.delete(mealItems).where(eq(mealItems.log_id, log.log_id));
            }
            // Luego eliminar logs
            await db.delete(dailyLogs).where(eq(dailyLogs.user_id, userId));
            // Finalmente eliminar usuario
            await db.delete(users).where(eq(users.user_id, userId));
        } catch (error) {
            console.error('Error al limpiar datos de prueba:', error);
        }
    });

    describe('POST /api/logs', () => {
        it('should create a new daily log', async () => {
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    date: testDate,
                    weight: '75.5'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('log');
            expect(response.body.log.weight).toBe('75.5');
            expect(response.body.log.date).toBe(testDate);
        });

        it('should update existing daily log', async () => {
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    date: testDate,
                    weight: '76.0'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('log');
            expect(response.body.log.weight).toBe('76.0');
        });

        it('should reject request without date', async () => {
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    weight: '75.5'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without weight', async () => {
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    date: testDate
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .post('/api/logs')
                .send({
                    date: testDate,
                    weight: '75.5'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/logs/:date', () => {
        it('should get daily log for a specific date', async () => {
            const response = await request(app)
                .get(`/api/logs/${testDate}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('log');
            expect(response.body).toHaveProperty('mealItems');
            expect(Array.isArray(response.body.mealItems)).toBe(true);
        });

        it('should return null log for non-existent date', async () => {
            const response = await request(app)
                .get('/api/logs/2024-12-31')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.log).toBeNull();
            expect(response.body.mealItems).toEqual([]);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get(`/api/logs/${testDate}`);

            expect(response.status).toBe(401);
        });
    });
});

