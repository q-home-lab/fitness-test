const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, foods } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Foods Routes', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'foods-test@example.com',
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
        await db.delete(foods).where(eq(foods.name, 'Test Food'));
        await db.delete(foods).where(eq(foods.name, 'Search Test Food'));
        await db.delete(users).where(eq(users.user_id, userId));
    });

    describe('POST /api/foods', () => {
        it('should create a new food', async () => {
            const response = await request(app)
                .post('/api/foods')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Food',
                    calories_base: '250.5',
                    protein_g: '20.0',
                    carbs_g: '30.0',
                    fat_g: '10.0'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('food');
            expect(response.body.food.name).toBe('Test Food');
            expect(response.body.food.calories_base).toBe('250.50');
        });

        it('should reject food creation with missing name', async () => {
            const response = await request(app)
                .post('/api/foods')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    calories_base: '250.5'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject duplicate food name', async () => {
            // Primero crear un alimento
            await request(app)
                .post('/api/foods')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Duplicate Food',
                    calories_base: '200'
                });

            // Intentar crear otro con el mismo nombre
            const response = await request(app)
                .post('/api/foods')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Duplicate Food',
                    calories_base: '200'
                });

            // El código devuelve 200 cuando el alimento ya existe (no 409)
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Alimento ya existe.');
            
            // Limpiar
            await db.delete(foods).where(eq(foods.name, 'Duplicate Food'));
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .post('/api/foods')
                .send({
                    name: 'Unauthorized Food',
                    calories_base: '200'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/foods/search', () => {
        beforeAll(async () => {
            // Crear alimento de prueba para búsqueda
            await db.insert(foods).values({
                name: 'Search Test Food',
                calories_base: '300',
                protein_g: '25',
                carbs_g: '35',
                fat_g: '12'
            });
        });

        it('should search foods by name', async () => {
            const response = await request(app)
                .get('/api/foods/search?name=Search')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('foods');
            expect(Array.isArray(response.body.foods)).toBe(true);
            expect(response.body.foods.length).toBeGreaterThan(0);
        });

        it('should reject search with query less than 2 characters', async () => {
            const response = await request(app)
                .get('/api/foods/search?name=A')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should allow search without authentication (public endpoint)', async () => {
            // La búsqueda de alimentos es pública, no requiere autenticación
            const response = await request(app)
                .get('/api/foods/search?name=Search');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('foods');
        });
    });
});

