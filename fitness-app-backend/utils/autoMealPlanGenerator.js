/**
 * Generador automático de planes de comidas para 7 días
 * Basado en principios científicos de nutrición
 * 
 * Referencias:
 * - USDA: Guías nutricionales
 * - ISSN: Distribución de macronutrientes
 * - OMS: Recomendaciones calóricas
 */

/**
 * Genera un plan de comidas automático para 7 días
 * @param {Object} params - Parámetros para generar el plan
 * @param {Array} availableFoods - Lista de alimentos disponibles
 * @param {Object} goal - Objetivo del usuario
 * @param {Object} user - Datos del usuario
 * @returns {Object} Plan de comidas para 7 días
 */
function generateAutoMealPlan(params) {
    const { availableFoods, goal, user } = params;

    if (!availableFoods || availableFoods.length === 0) {
        throw new Error('No hay alimentos disponibles para generar el plan');
    }

    // Calcular necesidades calóricas diarias
    const dailyCalories = goal && goal.dailyCalorieGoal 
        ? parseFloat(goal.dailyCalorieGoal)
        : 2000; // Default

    // Calcular macronutrientes según objetivo (ISSN guidelines)
    let proteinPercent = 25; // 25% de proteína
    let carbsPercent = 45;    // 45% de carbohidratos
    let fatPercent = 30;      // 30% de grasa

    if (goal && goal.goalType === 'weight_loss') {
        // Para pérdida de peso: más proteína, menos carbohidratos
        proteinPercent = 30;
        carbsPercent = 40;
        fatPercent = 30;
    } else if (goal && goal.goalType === 'weight_gain') {
        // Para ganancia: más carbohidratos
        proteinPercent = 25;
        carbsPercent = 50;
        fatPercent = 25;
    }

    const proteinGrams = (dailyCalories * proteinPercent / 100) / 4; // 4 kcal/g
    const carbsGrams = (dailyCalories * carbsPercent / 100) / 4; // 4 kcal/g
    const fatGrams = (dailyCalories * fatPercent / 100) / 9; // 9 kcal/g

    // Categorizar alimentos
    const proteinFoods = availableFoods.filter(food => 
        parseFloat(food.protein_g || 0) > 15 // Alto en proteína
    );
    const carbFoods = availableFoods.filter(food => 
        parseFloat(food.carbs_g || 0) > 20 && parseFloat(food.protein_g || 0) < 10 // Alto en carbohidratos
    );
    const vegetableFoods = availableFoods.filter(food => 
        parseFloat(food.calories_base || 0) < 50 // Verduras bajas en calorías
    );
    const healthyFats = availableFoods.filter(food => 
        parseFloat(food.fat_g || 0) > 5 && parseFloat(food.calories_base || 0) > 100 // Fuentes de grasa saludable
    );

    // Días de la semana
    const daysOfWeek = [
        { day: 0, name: 'Domingo' },
        { day: 1, name: 'Lunes' },
        { day: 2, name: 'Martes' },
        { day: 3, name: 'Miércoles' },
        { day: 4, name: 'Jueves' },
        { day: 5, name: 'Viernes' },
        { day: 6, name: 'Sábado' },
    ];

    const mealPlan = {
        name: goal && goal.goalType === 'weight_loss'
            ? 'Plan de Comidas 7 Días - Pérdida de Peso'
            : goal && goal.goalType === 'weight_gain'
            ? 'Plan de Comidas 7 Días - Ganancia Muscular'
            : 'Plan de Comidas 7 Días - Mantenimiento',
        description: `Plan nutricional automático de 7 días diseñado para ${goal ? goal.goalType : 'mantenimiento'}. Objetivo: ${dailyCalories} kcal/día (Proteína: ${proteinPercent}%, Carbohidratos: ${carbsPercent}%, Grasas: ${fatPercent}%).`,
        dailyCalories: dailyCalories,
        macros: {
            protein: { grams: proteinGrams.toFixed(0), percent: proteinPercent },
            carbs: { grams: carbsGrams.toFixed(0), percent: carbsPercent },
            fat: { grams: fatGrams.toFixed(0), percent: fatPercent },
        },
        days: [],
    };

    // Generar plan para cada día
    daysOfWeek.forEach((dayInfo) => {
        const dayPlan = {
            day_of_week: dayInfo.day,
            dayName: dayInfo.name,
            breakfast: generateMeal('breakfast', proteinFoods, carbFoods, vegetableFoods, healthyFats, dailyCalories * 0.25), // 25% en desayuno
            lunch: generateMeal('lunch', proteinFoods, carbFoods, vegetableFoods, healthyFats, dailyCalories * 0.35), // 35% en comida
            dinner: generateMeal('dinner', proteinFoods, carbFoods, vegetableFoods, healthyFats, dailyCalories * 0.30), // 30% en cena
            snacks: generateSnacks(proteinFoods, carbFoods, vegetableFoods, dailyCalories * 0.10), // 10% en snacks
        };

        mealPlan.days.push(dayPlan);
    });

    return mealPlan;
}

/**
 * Genera una comida específica
 */
function generateMeal(mealType, proteinFoods, carbFoods, vegetableFoods, healthyFats, targetCalories) {
    const meal = [];
    let currentCalories = 0;

    // Desayuno: más carbohidratos, proteína moderada
    if (mealType === 'breakfast') {
        // Cereal/carbohidrato
        if (carbFoods.length > 0) {
            const carb = selectRandomFood(carbFoods);
            const carbCaloriesPer100g = parseFloat(carb.calories_base || 0);
            if (carbCaloriesPer100g > 0) {
                const quantity = Math.min(150, Math.max(50, (targetCalories * 0.4) / (carbCaloriesPer100g / 100)));
                meal.push(`${quantity.toFixed(0)}g de ${carb.name}`);
                currentCalories += (carbCaloriesPer100g / 100) * quantity;
            }
        }
        // Proteína
        if (proteinFoods.length > 0 && currentCalories < targetCalories * 0.7) {
            const protein = selectRandomFood(proteinFoods);
            const proteinCaloriesPer100g = parseFloat(protein.calories_base || 0);
            if (proteinCaloriesPer100g > 0) {
                const quantity = Math.min(100, Math.max(50, (targetCalories * 0.3) / (proteinCaloriesPer100g / 100)));
                meal.push(`${quantity.toFixed(0)}g de ${protein.name}`);
                currentCalories += (proteinCaloriesPer100g / 100) * quantity;
            }
        }
    }
    // Comida/Cena: balance proteína + carbohidratos + verduras
    else {
        // Proteína principal
        if (proteinFoods.length > 0) {
            const protein = selectRandomFood(proteinFoods);
            const proteinCaloriesPer100g = parseFloat(protein.calories_base || 0);
            if (proteinCaloriesPer100g > 0) {
                const quantity = Math.min(200, Math.max(50, (targetCalories * 0.4) / (proteinCaloriesPer100g / 100)));
                meal.push(`${quantity.toFixed(0)}g de ${protein.name}`);
                currentCalories += (proteinCaloriesPer100g / 100) * quantity;
            }
        }
        // Carbohidrato acompañante
        if (carbFoods.length > 0 && currentCalories < targetCalories * 0.7) {
            const carb = selectRandomFood(carbFoods);
            const carbCaloriesPer100g = parseFloat(carb.calories_base || 0);
            if (carbCaloriesPer100g > 0) {
                const quantity = Math.min(150, Math.max(50, (targetCalories * 0.3) / (carbCaloriesPer100g / 100)));
                meal.push(`${quantity.toFixed(0)}g de ${carb.name}`);
                currentCalories += (carbCaloriesPer100g / 100) * quantity;
            }
        }
        // Verdura
        if (vegetableFoods.length > 0 && currentCalories < targetCalories * 0.9) {
            const veg = selectRandomFood(vegetableFoods);
            const vegCaloriesPer100g = parseFloat(veg.calories_base || 0);
            const quantity = 150; // Porción estándar de verdura
            meal.push(`${quantity.toFixed(0)}g de ${veg.name}`);
            currentCalories += (vegCaloriesPer100g / 100) * quantity;
        }
    }

    return meal.join(', ');
}

/**
 * Genera snacks
 */
function generateSnacks(proteinFoods, carbFoods, vegetableFoods, targetCalories) {
    const snacks = [];
    
    // Snack 1: Fruta o verdura
    if (vegetableFoods.length > 0 || carbFoods.length > 0) {
        const lowCalorieFoods = [...vegetableFoods, ...carbFoods].filter(f => {
            const calories = parseFloat(f.calories_base || 0);
            return calories > 0 && calories < 100;
        });
        if (lowCalorieFoods.length > 0) {
            const food = selectRandomFood(lowCalorieFoods);
            if (food) {
                const foodCaloriesPer100g = parseFloat(food.calories_base || 0);
                if (foodCaloriesPer100g > 0) {
                    const quantity = Math.min(100, Math.max(50, (targetCalories * 0.5) / (foodCaloriesPer100g / 100)));
                    snacks.push(`${quantity.toFixed(0)}g de ${food.name}`);
                }
            }
        }
    }
    
    // Snack 2: Proteína ligera (opcional)
    if (proteinFoods.length > 0) {
        const lightProteins = proteinFoods.filter(f => {
            const calories = parseFloat(f.calories_base || 0);
            return calories > 0 && calories < 200;
        });
        if (lightProteins.length > 0) {
            const protein = selectRandomFood(lightProteins);
            if (protein) {
                const proteinCaloriesPer100g = parseFloat(protein.calories_base || 0);
                if (proteinCaloriesPer100g > 0) {
                    const quantity = Math.min(50, Math.max(30, (targetCalories * 0.5) / (proteinCaloriesPer100g / 100)));
                    snacks.push(`${quantity.toFixed(0)}g de ${protein.name}`);
                }
            }
        }
    }

    return snacks.join(', ') || 'Fruta o verdura fresca';
}

/**
 * Selecciona un alimento aleatorio de una lista
 */
function selectRandomFood(foods) {
    if (!foods || foods.length === 0) return null;
    return foods[Math.floor(Math.random() * foods.length)];
}

module.exports = {
    generateAutoMealPlan,
};

