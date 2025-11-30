const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, foods, dailyLogs, mealItems } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Meal Items Routes', () => {
    let authToken;
    let userId;
    let foodId;
    let logId;

    beforeAll(async () => {
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'mealitems-test@example.com',
            password_hash: passwordHash
        }).returning();
        userId = result[0].user_id;

        authToken = jwt.sign(
            { id: userId, email: result[0].email },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );

        // Crear alimento de prueba
        const foodResult = await db.insert(foods).values({
            name: 'Meal Items Test Food',
            calories_base: '250',
            protein_g: '20',
            carbs_g: '30',
            fat_g: '10'
        }).returning();
        foodId = foodResult[0].food_id;

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
        await db.delete(mealItems).where(eq(mealItems.log_id, logId));
        await db.delete(dailyLogs).where(eq(dailyLogs.log_id, logId));
        await db.delete(foods).where(eq(foods.food_id, foodId));
        await db.delete(users).where(eq(users.user_id, userId));
    });

    describe('POST /api/meal-items', () => {
        it('should create a meal item successfully', async () => {
            const response = await request(app)
                .post('/api/meal-items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    log_id: logId,
                    food_id: foodId,
                    quantity_grams: '200',
                    meal_type: 'Desayuno',
                    consumed_calories: '500'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('mealItem');
            expect(response.body).toHaveProperty('updatedLog');
            expect(response.body.updatedLog).toHaveProperty('log');
            expect(response.body.updatedLog).toHaveProperty('mealItems');
        });

        it('should reject request with missing fields', async () => {
            const response = await request(app)
                .post('/api/meal-items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    log_id: logId,
                    food_id: foodId
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request with invalid quantity', async () => {
            const response = await request(app)
                .post('/api/meal-items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    log_id: logId,
                    food_id: foodId,
                    quantity_grams: '-10',
                    meal_type: 'Desayuno',
                    consumed_calories: '500'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .post('/api/meal-items')
                .send({
                    log_id: logId,
                    food_id: foodId,
                    quantity_grams: '200',
                    meal_type: 'Desayuno',
                    consumed_calories: '500'
                });

            expect(response.status).toBe(401);
        });
    });
});

