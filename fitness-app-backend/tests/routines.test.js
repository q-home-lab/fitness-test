const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, routines, exercises, routineExercises } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Routines Routes', () => {
    let authToken;
    let userId;
    let routineId;
    let exerciseId;

    beforeAll(async () => {
        // Limpiar datos de pruebas anteriores si existen
        const existingUsers = await db.select().from(users).where(eq(users.email, 'routines-test@example.com'));
        for (const user of existingUsers) {
            await db.delete(users).where(eq(users.user_id, user.user_id));
        }
        await db.delete(exercises).where(eq(exercises.name, 'Routines Test Exercise'));
        
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'routines-test@example.com',
            password_hash: passwordHash
        }).returning();
        userId = result[0].user_id;

        authToken = jwt.sign(
            { id: userId, email: result[0].email },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );

        // Crear ejercicio de prueba con nombre único
        const exerciseResult = await db.insert(exercises).values({
            name: 'Routines Test Exercise',
            category: 'Fuerza',
            default_calories_per_minute: '5',
            is_public: true
        }).returning();
        exerciseId = exerciseResult[0].exercise_id;
    });

    afterAll(async () => {
        // Limpiar datos de prueba en orden correcto (primero las dependencias)
        if (routineId) {
            await db.delete(routineExercises).where(eq(routineExercises.routine_id, routineId));
        }
        if (userId) {
            await db.delete(routines).where(eq(routines.user_id, userId));
        }
        if (exerciseId) {
            await db.delete(exercises).where(eq(exercises.exercise_id, exerciseId));
        }
        // También limpiar por nombre por si acaso
        await db.delete(exercises).where(eq(exercises.name, 'Routines Test Exercise'));
        if (userId) {
            await db.delete(users).where(eq(users.user_id, userId));
        }
    });

    describe('POST /api/routines', () => {
        it('should create a new routine', async () => {
            const response = await request(app)
                .post('/api/routines')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Routine',
                    description: 'Test Description'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('routine');
            expect(response.body.routine.name).toBe('Test Routine');
            routineId = response.body.routine.routine_id;
        });

        it('should reject routine creation without name', async () => {
            const response = await request(app)
                .post('/api/routines')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Test Description'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/routines', () => {
        it('should get all active routines for user', async () => {
            const response = await request(app)
                .get('/api/routines')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('routines');
            expect(Array.isArray(response.body.routines)).toBe(true);
        });
    });

    describe('GET /api/routines/:routineId', () => {
        it('should get routine details with exercises', async () => {
            const response = await request(app)
                .get(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('routine');
            expect(response.body.routine).toHaveProperty('exercises');
            expect(Array.isArray(response.body.routine.exercises)).toBe(true);
        });

        it('should reject request for non-existent routine', async () => {
            const response = await request(app)
                .get('/api/routines/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/routines/:routineId/exercises', () => {
        beforeEach(async () => {
            // Limpiar ejercicios de rutina antes de cada test
            if (routineId) {
                await db.delete(routineExercises).where(eq(routineExercises.routine_id, routineId));
            }
        });
        
        it('should add exercise to routine', async () => {
            // Verificar que el ejercicio existe
            const exerciseCheck = await db.select()
                .from(exercises)
                .where(eq(exercises.exercise_id, exerciseId))
                .limit(1);
            
            expect(exerciseCheck.length).toBeGreaterThan(0);
            expect(exerciseCheck[0].exercise_id).toBe(exerciseId);
            
            const response = await request(app)
                .post(`/api/routines/${routineId}/exercises`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId,
                    sets: 3,
                    reps: 10,
                    weight_kg: 20,
                    order_index: 1
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('routineExercise');
        });

        it('should reject adding exercise without required fields', async () => {
            const response = await request(app)
                .post(`/api/routines/${routineId}/exercises`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/routines/:routineId', () => {
        it('should update routine', async () => {
            const response = await request(app)
                .put(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Routine Name',
                    description: 'Updated Description'
                });

            expect(response.status).toBe(200);
            expect(response.body.routine.name).toBe('Updated Routine Name');
        });
    });

    describe('DELETE /api/routines/:routineId', () => {
        it('should deactivate routine', async () => {
            const response = await request(app)
                .delete(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });
});

