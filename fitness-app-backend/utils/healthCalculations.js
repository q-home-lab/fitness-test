// /utils/healthCalculations.js
// Funciones para calcular métricas de salud personalizadas

/**
 * Calcula el BMI (Body Mass Index)
 * @param {number} weight - Peso en kg
 * @param {number} height - Altura en cm
 * @returns {number} BMI
 */
function calculateBMI(weight, height) {
    if (!weight || !height || height <= 0) return null;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

/**
 * Obtiene la categoría del BMI
 * @param {number} bmi - BMI calculado
 * @returns {string} Categoría del BMI
 */
function getBMICategory(bmi) {
    if (!bmi) return null;
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
}

/**
 * Calcula el porcentaje de grasa corporal usando la fórmula de Deurenberg
 * @param {number} bmi - BMI
 * @param {number} age - Edad en años
 * @param {string} gender - 'male', 'female', 'other'
 * @returns {number} Porcentaje de grasa corporal
 */
function calculateBodyFatPercentage(bmi, age, gender) {
    if (!bmi || !age || !gender) return null;
    
    // Fórmula de Deurenberg: BF% = (1.20 × BMI) + (0.23 × Age) − (10.8 × gender) − 5.4
    // gender: 1 para hombres, 0 para mujeres
    const genderFactor = gender === 'male' ? 1 : 0;
    const bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
    
    // Asegurar valores razonables (entre 5% y 50%)
    return Math.max(5, Math.min(50, parseFloat(bodyFat.toFixed(1))));
}

/**
 * Calcula el BMR (Basal Metabolic Rate) usando la fórmula de Mifflin-St Jeor
 * @param {number} weight - Peso en kg
 * @param {number} height - Altura en cm
 * @param {number} age - Edad en años
 * @param {string} gender - 'male', 'female', 'other'
 * @returns {number} BMR en calorías
 */
function calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) return null;
    
    // Fórmula de Mifflin-St Jeor:
    // Hombres: BMR = 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad(años) + 5
    // Mujeres: BMR = 10 × peso(kg) + 6.25 × altura(cm) - 5 × edad(años) - 161
    const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
    const genderAdjustment = gender === 'male' ? 5 : -161;
    
    return Math.round(baseBMR + genderAdjustment);
}

/**
 * Calcula el TDEE (Total Daily Energy Expenditure) basado en el nivel de actividad
 * @param {number} bmr - BMR en calorías
 * @param {string} activityLevel - 'sedentary', 'light', 'moderate', 'active', 'very_active'
 * @returns {number} TDEE en calorías
 */
function calculateTDEE(bmr, activityLevel = 'moderate') {
    if (!bmr) return null;
    
    const activityMultipliers = {
        sedentary: 1.2,      // Poco o ningún ejercicio
        light: 1.375,        // Ejercicio ligero 1-3 días/semana
        moderate: 1.55,      // Ejercicio moderado 3-5 días/semana
        active: 1.725,       // Ejercicio duro 6-7 días/semana
        very_active: 1.9     // Ejercicio muy duro, trabajo físico
    };
    
    const multiplier = activityMultipliers[activityLevel] || activityMultipliers.moderate;
    return Math.round(bmr * multiplier);
}

/**
 * Calcula el peso objetivo recomendado basado en BMI saludable
 * @param {number} height - Altura en cm
 * @param {string} goalType - 'weight_loss', 'weight_gain', 'maintain'
 * @returns {number} Peso objetivo recomendado en kg
 */
function calculateRecommendedWeight(height, goalType = 'maintain') {
    if (!height || height <= 0) return null;
    
    const heightInMeters = height / 100;
    
    // BMI saludable está entre 18.5 y 24.9
    // Usamos el punto medio (21.7) como referencia
    let targetBMI = 21.7;
    
    if (goalType === 'weight_loss') {
        targetBMI = 22.0; // Ligeramente más bajo para pérdida de peso
    } else if (goalType === 'weight_gain') {
        targetBMI = 23.5; // Ligeramente más alto para ganancia de peso
    }
    
    const recommendedWeight = targetBMI * (heightInMeters * heightInMeters);
    return parseFloat(recommendedWeight.toFixed(1));
}

/**
 * Calcula el porcentaje de grasa corporal objetivo basado en el peso objetivo
 * @param {number} targetWeight - Peso objetivo en kg
 * @param {number} height - Altura en cm
 * @param {number} age - Edad en años
 * @param {string} gender - 'male', 'female', 'other'
 * @returns {number} Porcentaje de grasa corporal objetivo
 */
function calculateTargetBodyFatPercentage(targetWeight, height, age, gender) {
    if (!targetWeight || !height || !age || !gender) return null;
    
    const targetBMI = calculateBMI(targetWeight, height);
    return calculateBodyFatPercentage(targetBMI, age, gender);
}

/**
 * Calcula las calorías recomendadas diarias basadas en el objetivo
 * @param {number} tdee - TDEE en calorías
 * @param {string} goalType - 'weight_loss', 'weight_gain', 'maintain'
 * @returns {number} Calorías diarias recomendadas
 */
function calculateRecommendedCalories(tdee, goalType = 'maintain') {
    if (!tdee) return null;
    
    // Déficit/superávit calórico recomendado
    const adjustments = {
        weight_loss: -500,      // Déficit de 500 kcal/día = ~0.5 kg/semana
        weight_gain: 500,       // Superávit de 500 kcal/día = ~0.5 kg/semana
        maintain: 0
    };
    
    const adjustment = adjustments[goalType] || 0;
    return Math.round(tdee + adjustment);
}

/**
 * Genera recomendaciones completas para el usuario
 * @param {Object} userData - Datos del usuario
 * @param {number} userData.weight - Peso actual en kg
 * @param {number} userData.height - Altura en cm
 * @param {number} userData.age - Edad en años
 * @param {string} userData.gender - 'male', 'female', 'other'
 * @param {string} userData.goalType - 'weight_loss', 'weight_gain', 'maintain'
 * @param {string} userData.activityLevel - Nivel de actividad (opcional)
 * @returns {Object} Objeto con todas las recomendaciones
 */
function generateHealthRecommendations(userData) {
    const { weight, height, age, gender, goalType = 'maintain', activityLevel = 'moderate' } = userData;
    
    if (!weight || !height || !age || !gender) {
        return null;
    }
    
    // Cálculos actuales
    const currentBMI = calculateBMI(weight, height);
    const currentBodyFat = calculateBodyFatPercentage(currentBMI, age, gender);
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    
    // Cálculos para el objetivo
    const recommendedWeight = calculateRecommendedWeight(height, goalType);
    const targetBMI = calculateBMI(recommendedWeight, height);
    const targetBodyFat = calculateTargetBodyFatPercentage(recommendedWeight, height, age, gender);
    const recommendedCalories = calculateRecommendedCalories(tdee, goalType);
    
    return {
        current: {
            bmi: currentBMI,
            bmiCategory: getBMICategory(currentBMI),
            bodyFatPercentage: currentBodyFat,
            bmr: bmr,
            tdee: tdee
        },
        target: {
            recommendedWeight: recommendedWeight,
            bmi: targetBMI,
            bmiCategory: getBMICategory(targetBMI),
            bodyFatPercentage: targetBodyFat,
            recommendedCalories: recommendedCalories
        },
        recommendations: {
            dailyCalories: recommendedCalories,
            weeklyWeightChange: goalType === 'weight_loss' ? -0.5 : goalType === 'weight_gain' ? 0.5 : 0
        }
    };
}

module.exports = {
    calculateBMI,
    getBMICategory,
    calculateBodyFatPercentage,
    calculateBMR,
    calculateTDEE,
    calculateRecommendedWeight,
    calculateTargetBodyFatPercentage,
    calculateRecommendedCalories,
    generateHealthRecommendations
};

