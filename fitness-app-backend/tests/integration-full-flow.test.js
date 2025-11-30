/**
 * Test de Integración Completo
 * 
 * Prueba todo el flujo de usuario desde el registro hasta crear una rutina completa:
 * 1. Registro de usuario
 * 2. Login
 * 3. Obtener perfil
 * 4. Crear log diario y registrar peso
 * 5. Crear alimento y registrar comida
 * 6. Crear ejercicio
 * 7. Crear rutina
 * 8. Añadir ejercicio a rutina
 * 9. Obtener rutina con ejercicios
 * 10. Actualizar rutina
 * 11. Eliminar ejercicio de rutina
 * 12. Eliminar rutina
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users, dailyLogs, foods, mealItems, exercises, routines, routineExercises } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Flujo Completo de Usuario - Registro hasta Rutina', () => {
    let authToken;
    let userId;
    let routineId;
    let exerciseId;
    let foodId;
    let logId;
    const testEmail = `integration-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!'; // Cumple con requisitos: mayúscula, minúscula, número, carácter especial

    // Limpiar todos los datos de prueba antes de comenzar
    beforeAll(async () => {
        // Buscar y eliminar usuario de prueba si existe
        const existingUsers = await db.select()
            .from(users)
            .where(eq(users.email, testEmail));
        
        for (const user of existingUsers) {
            // Limpiar en orden: mealItems → logs → routines → exercises → foods → users
            const userRoutines = await db.select()
                .from(routines)
                .where(eq(routines.user_id, user.user_id));
            
            for (const routine of userRoutines) {
                await db.delete(routineExercises)
                    .where(eq(routineExercises.routine_id, routine.routine_id));
            }
            
            await db.delete(routines).where(eq(routines.user_id, user.user_id));
            
            // Obtener logs del usuario para limpiar mealItems
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, user.user_id));
            for (const log of userLogs) {
                await db.delete(mealItems).where(eq(mealItems.log_id, log.log_id));
            }
            await db.delete(dailyLogs).where(eq(dailyLogs.user_id, user.user_id));
            await db.delete(users).where(eq(users.user_id, user.user_id));
        }
    });

    afterAll(async () => {
        // Limpiar todos los datos de prueba
        if (routineId) {
            await db.delete(routineExercises).where(eq(routineExercises.routine_id, routineId));
        }
        if (userId) {
            await db.delete(routines).where(eq(routines.user_id, userId));
            
            // Obtener logs del usuario para limpiar mealItems
            const userLogs = await db.select().from(dailyLogs).where(eq(dailyLogs.user_id, userId));
            for (const log of userLogs) {
                await db.delete(mealItems).where(eq(mealItems.log_id, log.log_id));
            }
            await db.delete(dailyLogs).where(eq(dailyLogs.user_id, userId));
            await db.delete(users).where(eq(users.user_id, userId));
        }
        if (exerciseId) {
            await db.delete(exercises).where(eq(exercises.exercise_id, exerciseId));
        }
        if (foodId) {
            await db.delete(foods).where(eq(foods.food_id, foodId));
        }
    });

    describe('Paso 1: Registro de Usuario', () => {
        it('debería registrar un nuevo usuario exitosamente', async () => {
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
            expect(response.body.user.email).toBe(testEmail);

            // Guardar token y userId para siguientes pasos
            authToken = response.body.token;
            userId = response.body.user.id;
        });
    });

    describe('Paso 2: Login', () => {
        it('debería hacer login exitosamente con las credenciales correctas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testEmail);
            
            // Actualizar token
            authToken = response.body.token;
        });

        it('debería rechazar login con contraseña incorrecta', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'WrongPassword123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Paso 3: Obtener Perfil', () => {
        it('debería obtener el perfil del usuario autenticado', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('profile');
            expect(response.body.profile.id).toBe(userId);
            expect(response.body.profile.email).toBe(testEmail);
        });
    });

    describe('Paso 4: Crear Log Diario y Registrar Peso', () => {
        it('debería crear un log diario con peso', async () => {
            const today = new Date().toISOString().split('T')[0];
            
            const response = await request(app)
                .post('/api/logs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    date: today,
                    weight: 75.5
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('log');
            expect(parseFloat(response.body.log.weight)).toBe(75.5);
            
            logId = response.body.log.log_id;
        });
    });

    describe('Paso 5: Crear Alimento y Registrar Comida', () => {
        it('debería crear un nuevo alimento', async () => {
            const response = await request(app)
                .post('/api/foods')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: `Test Food ${Date.now()}`,
                    calories_base: 100,
                    protein_g: 20,
                    carbs_g: 5,
                    fat_g: 2
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('food');
            expect(response.body.food).toHaveProperty('food_id');
            
            foodId = response.body.food.food_id;
        });

        it('debería registrar una comida consumida', async () => {
            // Calcular calorías: 100 kcal por 100g, entonces 200g = 200 kcal
            const quantity_grams = 200;
            const calories_base = 100; // kcal por 100g
            const consumed_calories = (calories_base / 100) * quantity_grams; // 200 kcal
            
            const response = await request(app)
                .post('/api/meal-items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    log_id: logId,
                    food_id: foodId,
                    quantity_grams: quantity_grams,
                    meal_type: 'Almuerzo',
                    consumed_calories: consumed_calories
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('mealItem');
            expect(parseFloat(response.body.mealItem.quantity_grams)).toBe(quantity_grams);
            expect(parseFloat(response.body.mealItem.consumed_calories)).toBe(consumed_calories);
        });
    });

    describe('Paso 6: Crear Ejercicio', () => {
        it('debería crear un nuevo ejercicio', async () => {
            const exerciseName = `Integration Test Exercise ${Date.now()}`;
            
            const response = await request(app)
                .post('/api/exercises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: exerciseName,
                    category: 'Fuerza',
                    default_calories_per_minute: '8'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('exercise');
            expect(response.body.exercise.name).toBe(exerciseName);
            
            exerciseId = response.body.exercise.exercise_id;
        });
    });

    describe('Paso 7: Crear Rutina', () => {
        it('debería crear una nueva rutina', async () => {
            const response = await request(app)
                .post('/api/routines')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Rutina de Prueba Completa',
                    description: 'Esta es una rutina de prueba para el flujo completo'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('routine');
            expect(response.body.routine.name).toBe('Rutina de Prueba Completa');
            
            routineId = response.body.routine.routine_id;
            expect(routineId).toBeDefined();
            expect(typeof routineId).toBe('number');
        });
    });

    describe('Paso 8: Añadir Ejercicio a Rutina', () => {
        it('debería añadir el ejercicio creado a la rutina', async () => {
            const response = await request(app)
                .post(`/api/routines/${routineId}/exercises`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    exercise_id: exerciseId,
                    sets: 3,
                    reps: 12,
                    weight_kg: 20,
                    order_index: 1
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('routineExercise');
            expect(response.body.routineExercise.sets).toBe(3);
            expect(response.body.routineExercise.reps).toBe(12);
        });
    });

    describe('Paso 9: Obtener Rutina con Ejercicios', () => {
        it('debería obtener la rutina con sus ejercicios incluidos', async () => {
            const response = await request(app)
                .get(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('routine');
            expect(response.body.routine.name).toBe('Rutina de Prueba Completa');
            expect(response.body.routine).toHaveProperty('exercises');
            expect(Array.isArray(response.body.routine.exercises)).toBe(true);
            expect(response.body.routine.exercises.length).toBeGreaterThan(0);
            
            // Verificar que el ejercicio añadido está en la lista
            const exercise = response.body.routine.exercises.find(
                ex => ex.exercise_id === exerciseId
            );
            expect(exercise).toBeDefined();
            expect(exercise.sets).toBe(3);
            expect(exercise.reps).toBe(12);
        });
    });

    describe('Paso 10: Actualizar Rutina', () => {
        it('debería actualizar el nombre y descripción de la rutina', async () => {
            const response = await request(app)
                .put(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Rutina Actualizada',
                    description: 'Descripción actualizada'
                });

            expect(response.status).toBe(200);
            expect(response.body.routine.name).toBe('Rutina Actualizada');
            expect(response.body.routine.description).toBe('Descripción actualizada');
        });
    });

    describe('Paso 11: Listar Todas las Rutinas', () => {
        it('debería listar todas las rutinas activas del usuario', async () => {
            const response = await request(app)
                .get('/api/routines')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('routines');
            expect(Array.isArray(response.body.routines)).toBe(true);
            expect(response.body.routines.length).toBeGreaterThan(0);
            
            // Verificar que nuestra rutina está en la lista
            const routine = response.body.routines.find(
                r => r.routine_id === routineId
            );
            expect(routine).toBeDefined();
        });
    });

    describe('Paso 12: Eliminar Ejercicio de Rutina', () => {
        it('debería eliminar el ejercicio de la rutina', async () => {
            // Primero obtener la rutina para obtener el routine_exercise_id
            const routineResponse = await request(app)
                .get(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(routineResponse.status).toBe(200);
            expect(routineResponse.body.routine.exercises.length).toBeGreaterThan(0);
            
            // Obtener el routine_exercise_id del primer ejercicio
            const routineExerciseId = routineResponse.body.routine.exercises[0].routine_exercise_id;
            
            // Ahora eliminar usando el routine_exercise_id correcto
            const response = await request(app)
                .delete(`/api/routines/${routineId}/exercises/${routineExerciseId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            
            // Verificar que el ejercicio fue eliminado
            const routineResponseAfter = await request(app)
                .get(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(routineResponseAfter.body.routine.exercises.length).toBe(0);
        });
    });

    describe('Paso 13: Eliminar Rutina', () => {
        it('debería desactivar (eliminar) la rutina', async () => {
            const response = await request(app)
                .delete(`/api/routines/${routineId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            
            // Verificar que la rutina fue desactivada
            const routinesResponse = await request(app)
                .get('/api/routines')
                .set('Authorization', `Bearer ${authToken}`);
            
            const routine = routinesResponse.body.routines.find(
                r => r.routine_id === routineId
            );
            expect(routine).toBeUndefined(); // No debería aparecer en rutinas activas
        });
    });
});

