/**
 * Generador automático de rutinas de 5 días (Cardio + Fuerza)
 * Basado en principios científicos de periodización y entrenamiento
 * 
 * Referencias:
 * - NSCA: Periodización del entrenamiento
 * - ACSM: Frecuencia y volumen óptimo
 */

/**
 * Genera una rutina automática de 5 días combinando cardio y fuerza
 * @param {Object} params - Parámetros para generar la rutina
 * @param {Array} availableExercises - Lista de ejercicios disponibles
 * @param {Object} goal - Objetivo del usuario
 * @param {Object} user - Datos del usuario
 * @returns {Object} Rutina generada con ejercicios para cada día
 */
function generateAutoRoutine(params) {
    const { availableExercises, goal, user } = params;

    if (!availableExercises || availableExercises.length === 0) {
        throw new Error('No hay ejercicios disponibles para generar la rutina');
    }

    // Separar ejercicios por categoría
    const strengthExercises = availableExercises.filter(ex => 
        ex.category === 'Fuerza' || ex.category.toLowerCase().includes('fuerza')
    );
    const cardioExercises = availableExercises.filter(ex => 
        ex.category === 'Cardio' || ex.category.toLowerCase().includes('cardio')
    );

    if (strengthExercises.length === 0 || cardioExercises.length === 0) {
        throw new Error('Se necesitan ejercicios de fuerza y cardio para generar la rutina');
    }

    // Determinar distribución según objetivo
    let strengthDays = 3; // Lunes, Miércoles, Viernes
    let cardioDays = 2;    // Martes, Jueves
    let intensity = 'moderate';

    if (goal && goal.goalType === 'weight_loss') {
        // Para pérdida de peso: más cardio
        strengthDays = 2;
        cardioDays = 3;
        intensity = 'moderate-high';
    } else if (goal && goal.goalType === 'weight_gain') {
        // Para ganancia: más fuerza
        strengthDays = 3;
        cardioDays = 2;
        intensity = 'moderate';
    }

    // Estructura de la semana (5 días)
    // 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes
    let weekStructure = [];
    
    // Ajustar según distribución
    if (strengthDays === 2 && cardioDays === 3) {
        // Para pérdida de peso: 2 días fuerza, 3 días cardio
        weekStructure = [
            { day: 1, dayName: 'Lunes', type: 'strength' },
            { day: 2, dayName: 'Martes', type: 'cardio' },
            { day: 3, dayName: 'Miércoles', type: 'strength' },
            { day: 4, dayName: 'Jueves', type: 'cardio' },
            { day: 5, dayName: 'Viernes', type: 'cardio' },
        ];
    } else {
        // Para ganancia o mantenimiento: 3 días fuerza, 2 días cardio
        weekStructure = [
            { day: 1, dayName: 'Lunes', type: 'strength' },
            { day: 2, dayName: 'Martes', type: 'cardio' },
            { day: 3, dayName: 'Miércoles', type: 'strength' },
            { day: 4, dayName: 'Jueves', type: 'cardio' },
            { day: 5, dayName: 'Viernes', type: 'strength' },
        ];
    }

    const routine = {
        name: goal && goal.goalType === 'weight_loss' 
            ? 'Rutina 5 Días - Pérdida de Peso'
            : goal && goal.goalType === 'weight_gain'
            ? 'Rutina 5 Días - Ganancia Muscular'
            : 'Rutina 5 Días - Mantenimiento',
        description: `Rutina automática de 5 días combinando ${strengthDays} días de fuerza y ${cardioDays} días de cardio, diseñada según tu objetivo de ${goal ? goal.goalType : 'mantenimiento'}.`,
        days: [],
    };

    // Generar ejercicios para cada día
    weekStructure.forEach((dayInfo, index) => {
        const dayRoutine = {
            day_of_week: dayInfo.day,
            dayName: dayInfo.dayName,
            type: dayInfo.type,
            exercises: [],
        };

        if (dayInfo.type === 'strength') {
            // Rutina de fuerza: 4-6 ejercicios, 3-4 series, 8-12 repeticiones
            const numExercises = goal && goal.goalType === 'weight_gain' ? 6 : 5;
            const selectedExercises = selectRandomExercises(strengthExercises, numExercises);
            
            selectedExercises.forEach((exercise, exIndex) => {
                // Determinar sets y reps según objetivo
                let sets = 3;
                let reps = 10;
                let weight_kg = 0;

                if (goal && goal.goalType === 'weight_gain') {
                    sets = 4;
                    reps = 8; // Menos reps, más peso para hipertrofia
                    weight_kg = estimateStartingWeight(user, exercise);
                } else if (goal && goal.goalType === 'weight_loss') {
                    sets = 3;
                    reps = 12; // Más reps, menos peso para resistencia
                }

                dayRoutine.exercises.push({
                    exercise_id: exercise.exercise_id,
                    exercise_name: exercise.name,
                    sets: sets,
                    reps: reps,
                    weight_kg: weight_kg,
                    duration_minutes: null,
                    order_index: exIndex + 1,
                });
            });
        } else {
            // Rutina de cardio: 2-3 ejercicios, 20-40 minutos
            const numExercises = goal && goal.goalType === 'weight_loss' ? 3 : 2;
            const selectedExercises = selectRandomExercises(cardioExercises, numExercises);
            
            selectedExercises.forEach((exercise, exIndex) => {
                // Duración según objetivo
                let duration_minutes = 30;
                if (goal && goal.goalType === 'weight_loss') {
                    duration_minutes = 40; // Más tiempo para quemar más calorías
                } else if (goal && goal.goalType === 'weight_gain') {
                    duration_minutes = 20; // Menos tiempo para preservar energía
                }

                dayRoutine.exercises.push({
                    exercise_id: exercise.exercise_id,
                    exercise_name: exercise.name,
                    sets: 1,
                    reps: null,
                    weight_kg: 0,
                    duration_minutes: duration_minutes,
                    order_index: exIndex + 1,
                });
            });
        }

        routine.days.push(dayRoutine);
    });

    return routine;
}

/**
 * Selecciona ejercicios aleatorios de una lista
 */
function selectRandomExercises(exercises, count) {
    const shuffled = [...exercises].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, exercises.length));
}

/**
 * Estima el peso inicial para un ejercicio basado en el usuario
 */
function estimateStartingWeight(user, exercise) {
    if (!user || !user.weight) return 0;
    
    const userWeight = parseFloat(user.weight);
    const exerciseName = exercise.name.toLowerCase();
    
    // Estimaciones basadas en porcentajes del peso corporal (principios NSCA)
    if (exerciseName.includes('press') && exerciseName.includes('banca')) {
        return Math.round(userWeight * 0.6); // 60% del peso corporal
    } else if (exerciseName.includes('sentadilla') || exerciseName.includes('squat')) {
        return Math.round(userWeight * 0.8); // 80% del peso corporal
    } else if (exerciseName.includes('peso muerto') || exerciseName.includes('deadlift')) {
        return Math.round(userWeight * 1.0); // 100% del peso corporal
    } else if (exerciseName.includes('remo') || exerciseName.includes('row')) {
        return Math.round(userWeight * 0.5); // 50% del peso corporal
    } else if (exerciseName.includes('press') && exerciseName.includes('militar')) {
        return Math.round(userWeight * 0.4); // 40% del peso corporal
    }
    
    // Default: 30% del peso corporal para ejercicios de fuerza superiores
    return Math.round(userWeight * 0.3);
}

module.exports = {
    generateAutoRoutine,
};

