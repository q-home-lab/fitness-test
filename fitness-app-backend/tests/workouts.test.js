const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, exercises, dailyLogs, dailyExercises } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Workouts Routes', () => {
    let authToken;
    let userId;
    let exerciseId;
    let logId;

    beforeAll(async () => {
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'workouts-test@example.com',
            password_hash: passwordHash
        }).returning();
        userId = result[0].user_id;

        authToken = jwt.sign(
            { id: userId, email: result[0].email },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );

        // Crear ejercicio de prueba
        const exerciseResult = await db.insert(exercises).values({
            name: 'Workout Test Exercise',
            category: 'Cardio',
            default_calories_per_minute: '10',
            is_public: true
        }).returning();
        exerciseId = exerciseResult[0].exercise_id;

        // Crear log diario de prueba
        const today = new Date().toISOString().split('T')[0];
        const logResult = await db.insert(dailyLogs).values({
            user_id: userId,
            date: today,
            weight: '75.5',
            consumed_calories: '0',
            burned_calories: '0'
        }).returning();
        logId = logResult[0].log_id;
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await db.delete(dailyExercises).where(eq(dailyExercises.log_id, logId));
        await db.delete(dailyLogs).where(eq(dailyLogs.log_id, logId));
        await db.delete(exercises).where(eq(exercises.exercise_id, exerciseId));
        await db.delete(users).where(eq(users.user_id, userId));
    });

    describe('POST /api/workouts/log', () => {
        it('should log a completed exercise', async () => {
            const response = await request(app)
                .post('/api/workouts/log')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId,
                    sets_done: 3,
                    reps_done: 10,
                    duration_minutes: null,
                    weight_kg: 20,
                    burned_calories: '150'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('dailyExercise');
            expect(response.body.dailyExercise.sets_done).toBe(3);
        });

        it('should reject request without exercise_id', async () => {
            const response = await request(app)
                .post('/api/workouts/log')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    sets_done: 3,
                    burned_calories: '150'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without sets_done', async () => {
            const response = await request(app)
                .post('/api/workouts/log')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId,
                    burned_calories: '150'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without burned_calories', async () => {
            const response = await request(app)
                .post('/api/workouts/log')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId,
                    sets_done: 3
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .post('/api/workouts/log')
                .send({
                    exercise_id: exerciseId,
                    sets_done: 3,
                    burned_calories: '150'
                });

            expect(response.status).toBe(401);
        });
    });
});

