const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const { mealItems, dailyLogs, foods } = require('../db/schema');
const { eq, asc } = require('drizzle-orm');
const logger = require('../utils/logger');
const { createLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../middleware/asyncHandler');

// Middleware de autenticación global para esta ruta
router.use(authenticateToken);

// =================================================================
// 1. POST /api/meal-items/
// REGISTRAR un alimento consumido (Meal Item)
// Usa transacciones para garantizar consistencia
// =================================================================
router.post('/', createLimiter, asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const { log_id, food_id, quantity_grams, meal_type, consumed_calories } = req.body;

    // Validación básica de campos
    if (!log_id || !food_id || !quantity_grams || !meal_type || !consumed_calories) {
        return res.status(400).json({ error: 'Faltan campos requeridos para registrar la comida.' });
    }
    
    const quantity = parseFloat(quantity_grams);
    const calories = parseFloat(consumed_calories);

    if (isNaN(quantity) || quantity <= 0 || isNaN(calories) || calories < 0) {
         return res.status(400).json({ error: 'Cantidad y/o calorías deben ser números positivos.' });
    }

    // Usar transacción para garantizar consistencia
    const result = await db.transaction(async (tx) => {
            // Paso 1: Verificar que el log existe y pertenece al usuario
            const currentLog = await tx.select()
                .from(dailyLogs)
                .where(eq(dailyLogs.log_id, log_id))
                .limit(1);

            if (currentLog.length === 0 || currentLog[0].user_id !== user_id) {
                throw new Error('Log diario no encontrado o no pertenece al usuario.');
            }

            // Paso 2: Insertar el nuevo Meal Item
            const newMealItem = await tx.insert(mealItems)
                .values({
                    log_id: log_id,
                    food_id: food_id,
                    quantity_grams: quantity.toFixed(2),
                    meal_type: meal_type,
                    consumed_calories: calories.toFixed(2),
                })
                .returning();

            // Paso 3: Actualizar las calorías totales consumidas en el Daily Log
            const existingCalories = parseFloat(currentLog[0].consumed_calories);
            const newTotalCalories = existingCalories + calories;

            await tx.update(dailyLogs)
                .set({
                    consumed_calories: newTotalCalories.toFixed(2),
                    updated_at: new Date(),
                })
                .where(eq(dailyLogs.log_id, log_id));

            // Paso 4: Obtener el log actualizado y todos los mealItems
            const updatedDailyLog = await tx.select()
                .from(dailyLogs)
                .where(eq(dailyLogs.log_id, log_id))
                .limit(1);
            
            const associatedMealItems = await tx.select({
                meal_item_id: mealItems.meal_item_id,
                quantity_grams: mealItems.quantity_grams,
                meal_type: mealItems.meal_type,
                consumed_calories: mealItems.consumed_calories,
                created_at: mealItems.created_at,
                food: {
                    food_id: foods.food_id,
                    name: foods.name,
                    calories_base: foods.calories_base,
                    protein_g: foods.protein_g,
                    carbs_g: foods.carbs_g,
                    fat_g: foods.fat_g,
                }
            })
            .from(mealItems)
            .leftJoin(foods, eq(mealItems.food_id, foods.food_id))
            .where(eq(mealItems.log_id, log_id))
            .orderBy(asc(mealItems.created_at));

            return {
                mealItem: newMealItem[0],
                updatedLog: {
                    log: updatedDailyLog[0],
                    mealItems: associatedMealItems
                }
            };
        });

    logger.info(`Meal item registrado exitosamente: user_id=${user_id}, log_id=${log_id}, food_id=${food_id}`);

    return res.status(201).json({
        message: 'Comida registrada y calorías actualizadas con éxito.',
        ...result
    });
}));

module.exports = router;