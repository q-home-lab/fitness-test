/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Gestión de objetivos de fitness del usuario
 */

/**
 * Rutas para gestionar objetivos del usuario
 * GET /api/goals - Obtener objetivo activo del usuario
 * POST /api/goals - Crear o actualizar objetivo
 * GET /api/goals/calculate-calories - Calcular calorías recomendadas
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('./authMiddleware');
const { db } = require('../db/db_config');
const schema = require('../db/schema');
const { userGoals, dailyLogs, users } = schema;
const { eq, and, desc } = require('drizzle-orm');
const logger = require('../utils/logger');
const { calculateBMR, calculateTDEE, calculateRecommendedCalories } = require('../utils/healthCalculations');
const asyncHandler = require('../middleware/asyncHandler');
const { routeValidations, handleValidationErrors } = require('../middleware/validation');

/**
 * Calcular calorías diarias recomendadas basado en objetivo de peso
 * Usa los datos reales del usuario (altura, edad, género) para calcular BMR y TDEE
 * 
 * @param {number} currentWeight - Peso actual en kg
 * @param {number} targetWeight - Peso objetivo en kg
 * @param {number} weeklyWeightChangeGoal - Cambio de peso semanal objetivo en kg
 * @param {string} goalType - 'weight_loss', 'weight_gain', 'maintain'
 * @param {Object} userData - Datos del usuario { height, age, gender, activityLevel }
 * @returns {Object} Objeto con calorías recomendadas y sugerencias de déficit
 */
function calculateDailyCalorieGoal(currentWeight, targetWeight, weeklyWeightChangeGoal, goalType, userData = {}) {
    const { height, age, gender, activityLevel = 'moderate' } = userData;
    
    // Validar y convertir datos del usuario
    const userHeight = height ? parseFloat(height) : null;
    const userAge = age ? parseInt(age) : null;
    const userGender = gender || null;
    const hasCompleteUserData = userHeight && userHeight > 0 && userAge && userAge > 0 && userGender;
    
    // Si tenemos datos completos del usuario (del onboarding), calcular BMR y TDEE precisos
    let bmr, tdee;
    if (hasCompleteUserData) {
        // Usar fórmula de Mifflin-St Jeor con datos reales del usuario
        bmr = calculateBMR(parseFloat(currentWeight), userHeight, userAge, userGender);
        tdee = calculateTDEE(bmr, activityLevel);
    } else {
        // Fallback: usar aproximación simplificada si faltan datos del onboarding
        // Fórmula aproximada: BMR ≈ 22 * peso(kg) para adultos
        // Usamos un promedio conservador basado en el peso actual
        bmr = Math.round(22 * parseFloat(currentWeight));
        tdee = calculateTDEE(bmr, activityLevel);
    }
    
    // Calcular déficit/superávit calórico necesario
    // Calorías necesarias para cambiar 1 kg de peso = ~7700 kcal
    // Si el objetivo es cambiar X kg por semana, necesitamos (X * 7700) / 7 kcal diarias
    let dailyCalorieAdjustment = 0;
    let idealDeficit = 0;
    
    if (goalType === 'weight_loss') {
        // Déficit calórico diario para perder peso
        const weeklyChange = parseFloat(weeklyWeightChangeGoal || -0.5);
        dailyCalorieAdjustment = (weeklyChange * 7700) / 7;
        idealDeficit = Math.abs(dailyCalorieAdjustment);
    } else if (goalType === 'weight_gain') {
        // Superávit calórico diario para ganar peso
        const weeklyChange = parseFloat(weeklyWeightChangeGoal || 0.5);
        dailyCalorieAdjustment = (weeklyChange * 7700) / 7;
        idealDeficit = -Math.abs(dailyCalorieAdjustment); // Negativo para ganancia
    }
    // Si es 'maintain', dailyCalorieAdjustment = 0, idealDeficit = 0
    
    // Calorías diarias recomendadas a consumir
    const dailyCalorieGoal = Math.round(tdee + dailyCalorieAdjustment);
    
    // Calcular calorías a quemar y déficit unificado
    // El TDEE ya incluye: BMR (metabolismo basal) + Actividad diaria
    // Déficit = TDEE - Calorías consumidas
    // 
    // Ejemplo: Si BMR = 1500, Actividad = 500, TDEE = 2000, Déficit objetivo = 500:
    //   - Consumir: 1500 kcal
    //   - Quemar (TDEE): 2000 kcal (1500 BMR + 500 actividad)
    //   - Déficit resultante: 2000 - 1500 = 500 kcal ✓
    //
    // Ejemplo del usuario: Si consume 2000 kcal y quema 1100 kcal:
    //   - Déficit = 2000 - 1100 = 900 kcal
    //   - Esto significa que el TDEE debería ser ~2900 para lograr ese déficit
    
    // Calcular actividad diaria (diferencia entre TDEE y BMR)
    // El TDEE = BMR * multiplicador de actividad, por lo que la actividad diaria = TDEE - BMR
    // Ejemplo: Si BMR = 1500 y TDEE = 2325 (moderate: 1.55), entonces actividad = 825 kcal
    let dailyActivity = Math.round(tdee - bmr);
    
    // Asegurar que la actividad diaria sea siempre un valor positivo válido
    // Si es 0 o negativo, recalcular basándose en el multiplicador de actividad
    if (dailyActivity <= 0 || isNaN(dailyActivity)) {
        // Calcular la actividad basándose en el multiplicador de actividad
        // El multiplicador incluye: 1 (BMR) + actividad adicional
        const activityMultipliers = {
            sedentary: 0.2,      // 1.2 - 1.0 = 0.2
            light: 0.375,        // 1.375 - 1.0 = 0.375
            moderate: 0.55,      // 1.55 - 1.0 = 0.55
            active: 0.725,       // 1.725 - 1.0 = 0.725
            very_active: 0.9     // 1.9 - 1.0 = 0.9
        };
        const activityMultiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate;
        dailyActivity = Math.round(bmr * activityMultiplier);
    }
    
    // Asegurar que siempre sea un número válido y positivo
    dailyActivity = Math.max(0, Math.round(dailyActivity));
    
    // Las calorías a quemar son el TDEE (que ya incluye BMR + actividad)
    // El déficit se logra automáticamente: Déficit = TDEE - Calorías consumidas
    const idealCaloriesToBurn = tdee;
    
    // Calcular el déficit real que se logrará
    // Déficit = Calorías quemadas - Calorías consumidas
    const actualDeficit = idealCaloriesToBurn - dailyCalorieGoal;
    
    // Calcular ejercicio adicional necesario si el déficit objetivo es mayor que el que se logra solo con dieta
    let exerciseCaloriesNeeded = 0;
    if (goalType === 'weight_loss' && idealDeficit > 0 && actualDeficit < idealDeficit) {
        // Si necesitamos más déficit del que logramos solo con dieta, necesitamos ejercicio adicional
        exerciseCaloriesNeeded = idealDeficit - actualDeficit;
    }
    
    // Si hay ejercicio adicional necesario, ajustar las calorías totales a quemar
    const totalCaloriesToBurn = idealCaloriesToBurn + exerciseCaloriesNeeded;
    // El déficit final es: calorías totales quemadas - calorías consumidas
    const finalDeficit = totalCaloriesToBurn - dailyCalorieGoal;
    
    // Asegurar que los valores sean números válidos (no NaN o undefined)
    const safeCaloriesToBurn = isNaN(totalCaloriesToBurn) || totalCaloriesToBurn <= 0 ? idealCaloriesToBurn : totalCaloriesToBurn;
    const safeDeficit = isNaN(finalDeficit) ? actualDeficit : finalDeficit;
    
    // Crear explicación más accesible y clara
    let explanation = '';
    const hasUserData = hasCompleteUserData;
    const weeklyChange = Math.abs(parseFloat(weeklyWeightChangeGoal || (goalType === 'weight_loss' ? -0.5 : 0.5)));
    
    if (goalType === 'weight_loss' && idealDeficit > 0) {
        if (exerciseCaloriesNeeded > 0) {
            // Necesita ejercicio adicional
            explanation = `Para perder ${weeklyChange.toFixed(1)} kg por semana:\n\n• Consume ${Math.round(dailyCalorieGoal)} kcal al día\n• Tu cuerpo quema ${Math.round(bmr)} kcal solo por existir (metabolismo basal)\n• Más ${Math.round(dailyActivity)} kcal por tu actividad diaria normal\n• Necesitas quemar ${Math.round(exerciseCaloriesNeeded)} kcal adicionales con ejercicio\n\nEsto crea un déficit de ${Math.round(finalDeficit)} kcal diarias.`;
        } else {
            // Solo con dieta
            explanation = `Para perder ${weeklyChange.toFixed(1)} kg por semana:\n\n• Consume ${Math.round(dailyCalorieGoal)} kcal al día\n• Tu cuerpo quema ${Math.round(bmr)} kcal solo por existir (metabolismo basal)\n• Más ${Math.round(dailyActivity)} kcal por tu actividad diaria normal\n\nEsto crea un déficit de ${Math.round(actualDeficit)} kcal diarias, suficiente para alcanzar tu objetivo sin necesidad de ejercicio adicional.`;
        }
    } else if (goalType === 'weight_gain') {
        explanation = `Para ganar ${weeklyChange.toFixed(1)} kg por semana:\n\n• Consume ${Math.round(dailyCalorieGoal)} kcal al día\n• Tu cuerpo quema ${Math.round(bmr)} kcal solo por existir (metabolismo basal)\n• Más ${Math.round(dailyActivity)} kcal por tu actividad diaria\n\nEsto te da un superávit de ${Math.round(Math.abs(actualDeficit))} kcal diarias para ganar peso de forma saludable.`;
    } else {
        explanation = `Para mantener tu peso actual:\n\n• Consume ${Math.round(dailyCalorieGoal)} kcal al día\n• Tu cuerpo quema ${Math.round(bmr)} kcal solo por existir (metabolismo basal)\n• Más ${Math.round(dailyActivity)} kcal por tu actividad diaria\n\nEsto mantiene un equilibrio calórico perfecto.`;
    }
    
    // Añadir nota sobre personalización si se usaron datos del usuario
    if (hasUserData) {
        const genderText = userGender === 'male' ? 'masculino' : userGender === 'female' ? 'femenino' : 'perfil';
        explanation += ` Estos cálculos están personalizados según tu sexo ${genderText}, ${userAge} años de edad y ${userHeight} cm de altura.`;
    } else {
        explanation += ` 💡 Para cálculos más precisos, completa tu perfil con género, edad y altura en la configuración.`;
    }
    
    // Resultado unificado: calorías a quemar y déficit en un solo valor
    // Asegurar que siempre tengamos valores numéricos válidos
    const finalCaloriesToBurn = exerciseCaloriesNeeded > 0 ? safeCaloriesToBurn : idealCaloriesToBurn;
    const finalDeficitValue = exerciseCaloriesNeeded > 0 ? safeDeficit : actualDeficit;
    
    // Validar y asegurar valores numéricos
    const validatedCaloriesToBurn = (isNaN(finalCaloriesToBurn) || finalCaloriesToBurn <= 0) 
        ? (isNaN(tdee) || tdee <= 0 ? 0 : Math.round(tdee))
        : Math.round(finalCaloriesToBurn);
    
    const validatedDeficit = (isNaN(finalDeficitValue)) 
        ? (isNaN(actualDeficit) ? 0 : Math.round(actualDeficit))
        : Math.round(finalDeficitValue);
    
    const result = {
        dailyCalorieGoal: Math.max(1200, Math.min(4000, dailyCalorieGoal)), // Limitar entre 1200 y 4000 kcal
        bmr: isNaN(bmr) || bmr <= 0 ? 0 : Math.round(bmr),
        tdee: isNaN(tdee) || tdee <= 0 ? 0 : Math.round(tdee),
        dailyActivity: isNaN(dailyActivity) || dailyActivity < 0 ? 0 : Math.round(dailyActivity),
        // Resultado unificado: calorías a quemar y déficit
        caloriesToBurn: validatedCaloriesToBurn,
        deficit: validatedDeficit,
        exerciseCaloriesNeeded: isNaN(exerciseCaloriesNeeded) || exerciseCaloriesNeeded < 0 ? 0 : Math.round(exerciseCaloriesNeeded),
        explanation: explanation
    };
    
    return result;
}

/**
 * GET /api/goals
 * Obtener el objetivo activo del usuario
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    
    const goals = await db.select()
        .from(userGoals)
        .where(and(
            eq(userGoals.user_id, user_id),
            eq(userGoals.is_active, true)
        ))
        .orderBy(desc(userGoals.created_at))
        .limit(1);
    
    if (goals.length === 0) {
        return res.status(200).json({ goal: null, message: 'No hay objetivo activo.' });
    }
    
    const goal = goals[0];
    
    // Calcular recomendaciones para el objetivo existente
    try {
        const userData = await db.select({
            height: users.height,
            age: users.age,
            gender: users.gender
        })
        .from(users)
        .where(eq(users.user_id, user_id))
        .limit(1);
        
        const user = userData[0] || {};
        
        const calorieCalculation = calculateDailyCalorieGoal(
            parseFloat(goal.current_weight),
            parseFloat(goal.target_weight),
            parseFloat(goal.weekly_weight_change_goal),
            goal.goal_type,
            {
                height: user.height ? parseFloat(user.height) : null,
                age: user.age ? parseInt(user.age) : null,
                gender: user.gender || null,
                activityLevel: 'moderate' // Por defecto, se puede mejorar obteniendo de perfil
            }
        );
        
        return res.status(200).json({ 
            goal: goal, 
            message: 'Objetivo obtenido con éxito.',
            recommendations: {
                bmr: calorieCalculation.bmr,
                tdee: calorieCalculation.tdee,
                dailyActivity: calorieCalculation.dailyActivity,
                caloriesToBurn: calorieCalculation.caloriesToBurn,
                deficit: calorieCalculation.deficit,
                exerciseCaloriesNeeded: calorieCalculation.exerciseCaloriesNeeded,
                explanation: calorieCalculation.explanation
            }
        });
    } catch (calcError) {
        // Si hay error al calcular, devolver solo el objetivo
        logger.error('Error al calcular recomendaciones:', { error: calcError.message });
        return res.status(200).json({ goal: goal, message: 'Objetivo obtenido con éxito.' });
    }
}));

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Crear o actualizar objetivo del usuario
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_weight
 *               - current_weight
 *             properties:
 *               target_weight:
 *                 type: number
 *                 minimum: 20
 *                 maximum: 300
 *                 description: Peso objetivo en kg
 *               current_weight:
 *                 type: number
 *                 minimum: 20
 *                 maximum: 300
 *                 description: Peso actual en kg
 *               weekly_weight_change_goal:
 *                 type: number
 *                 default: -0.5
 *                 description: Cambio de peso semanal objetivo en kg
 *               goal_type:
 *                 type: string
 *                 enum: [weight_loss, weight_gain, maintain]
 *                 default: weight_loss
 *               activity_level:
 *                 type: string
 *                 enum: [sedentary, light, moderate, active, very_active]
 *                 default: moderate
 *     responses:
 *       201:
 *         description: Objetivo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goal:
 *                   $ref: '#/components/schemas/Goal'
 *                 recommendations:
 *                   type: object
 */
/**
 * POST /api/goals
 * Crear o actualizar objetivo del usuario
 */
router.post('/', 
    authenticateToken,
    routeValidations.createGoal || ((req, res, next) => next()),
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const user_id = req.user.id;
        const { target_weight, current_weight, weekly_weight_change_goal, goal_type, activity_level } = req.body;
        
        if (!target_weight || !current_weight) {
            return res.status(400).json({ error: 'Faltan campos requeridos: target_weight y current_weight.' });
        }
        
        const goalType = goal_type || 'weight_loss';
        const weeklyChange = weekly_weight_change_goal || (goalType === 'weight_loss' ? -0.5 : 0.5);
        
        // Obtener datos del usuario para cálculos precisos
        const userData = await db.select({
            height: users.height,
            age: users.age,
            gender: users.gender
        })
        .from(users)
        .where(eq(users.user_id, user_id))
        .limit(1);
        
        const user = userData[0] || {};
        
        // Desactivar objetivos anteriores
        await db.update(userGoals)
            .set({ is_active: false, updated_at: new Date() })
            .where(and(
                eq(userGoals.user_id, user_id),
                eq(userGoals.is_active, true)
            ));
        
        // Calcular calorías diarias objetivo con datos del usuario
        const calorieCalculation = calculateDailyCalorieGoal(
            parseFloat(current_weight),
            parseFloat(target_weight),
            parseFloat(weeklyChange),
            goalType,
            {
                height: user.height ? parseFloat(user.height) : null,
                age: user.age ? parseInt(user.age) : null,
                gender: user.gender || null,
                activityLevel: activity_level || 'moderate'
            }
        );
        
        // Crear nuevo objetivo
        const newGoal = await db.insert(userGoals)
            .values({
                user_id: user_id,
                target_weight: parseFloat(target_weight).toFixed(2),
                current_weight: parseFloat(current_weight).toFixed(2),
                daily_calorie_goal: calorieCalculation.dailyCalorieGoal.toFixed(2),
                weekly_weight_change_goal: parseFloat(weeklyChange).toFixed(2),
                goal_type: goalType,
                is_active: true,
            })
            .returning();
        
        return res.status(201).json({
            message: 'Objetivo creado con éxito.',
            goal: newGoal[0],
            recommendations: {
                bmr: calorieCalculation.bmr,
                tdee: calorieCalculation.tdee,
                dailyActivity: calorieCalculation.dailyActivity,
                caloriesToBurn: calorieCalculation.caloriesToBurn,
                deficit: calorieCalculation.deficit,
                exerciseCaloriesNeeded: calorieCalculation.exerciseCaloriesNeeded,
                explanation: calorieCalculation.explanation
            }
        });
    })
);

/**
 * GET /api/goals/calculate-calories
 * Calcular calorías recomendadas sin crear objetivo
 */
router.get('/calculate-calories', authenticateToken, asyncHandler(async (req, res) => {
    const user_id = req.user.id;
    const { current_weight, target_weight, weekly_weight_change_goal, goal_type, activity_level } = req.query;
    
    if (!current_weight || !target_weight) {
        return res.status(400).json({ error: 'Faltan parámetros: current_weight y target_weight.' });
    }
    
    const goalType = goal_type || 'weight_loss';
    const weeklyChange = weekly_weight_change_goal || (goalType === 'weight_loss' ? -0.5 : 0.5);
    
    // Obtener datos del usuario para cálculos precisos
    const userData = await db.select({
        height: users.height,
        age: users.age,
        gender: users.gender
    })
    .from(users)
    .where(eq(users.user_id, user_id))
    .limit(1);
    
    const user = userData[0] || {};
    
    // Calcular calorías con datos del usuario
    const calorieCalculation = calculateDailyCalorieGoal(
        parseFloat(current_weight),
        parseFloat(target_weight),
        parseFloat(weeklyChange),
        goalType,
        {
            height: user.height ? parseFloat(user.height) : null,
            age: user.age ? parseInt(user.age) : null,
            gender: user.gender || null,
            activityLevel: activity_level || 'moderate'
        }
    );
    
    return res.status(200).json({
        daily_calorie_goal: calorieCalculation.dailyCalorieGoal,
        weekly_weight_change_goal: parseFloat(weeklyChange),
        goal_type: goalType,
        bmr: calorieCalculation.bmr,
        tdee: calorieCalculation.tdee,
        dailyActivity: calorieCalculation.dailyActivity,
        caloriesToBurn: calorieCalculation.caloriesToBurn,
        deficit: calorieCalculation.deficit,
        exerciseCaloriesNeeded: calorieCalculation.exerciseCaloriesNeeded,
        explanation: calorieCalculation.explanation
    });
}));

module.exports = router;

