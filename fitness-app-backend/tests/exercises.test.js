const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, exercises } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Exercises Routes', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Limpiar datos de pruebas anteriores si existen
        await db.delete(exercises).where(eq(exercises.name, 'Test Exercise'));
        const existingUsers = await db.select().from(users).where(eq(users.email, 'exercises-test@example.com'));
        for (const user of existingUsers) {
            await db.delete(users).where(eq(users.user_id, user.user_id));
        }
        
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'exercises-test@example.com',
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
        await db.delete(exercises).where(eq(exercises.name, 'Test Exercise'));
        await db.delete(users).where(eq(users.user_id, userId));
    });

    describe('POST /api/exercises', () => {
        beforeEach(async () => {
            // Limpiar ejercicio antes de cada test para evitar conflictos
            await db.delete(exercises).where(eq(exercises.name, 'Test Exercise'));
        });
        
        it('should create a new exercise', async () => {
            const response = await request(app)
                .post('/api/exercises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Exercise',
                    category: 'Fuerza',
                    default_calories_per_minute: '8'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('exercise');
            expect(response.body.exercise.name).toBe('Test Exercise');
        });

        it('should reject exercise creation without name', async () => {
            const response = await request(app)
                .post('/api/exercises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    category: 'Cardio'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject duplicate exercise name', async () => {
            // Crear el ejercicio primero (el beforeEach lo limpió)
            await db.insert(exercises).values({
                name: 'Test Exercise',
                category: 'Fuerza',
                default_calories_per_minute: '8',
                is_public: true
            });
            
            // Ahora intentar crear duplicado
            const response = await request(app)
                .post('/api/exercises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Exercise',
                    category: 'Cardio'
                });

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/exercises', () => {
        it('should get all public exercises', async () => {
            const response = await request(app)
                .get('/api/exercises')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('exercises');
            expect(Array.isArray(response.body.exercises)).toBe(true);
        });
    });
});

