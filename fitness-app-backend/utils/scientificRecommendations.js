/**
 * Recomendaciones basadas en evidencia científica
 * Referencias basadas en estudios oficiales de medicina, nutrición y deporte de élite
 * 
 * Referencias principales:
 * - OMS (Organización Mundial de la Salud)
 * - ACSM (American College of Sports Medicine)
 * - AHA (American Heart Association)
 * - USDA (United States Department of Agriculture)
 * - NSCA (National Strength and Conditioning Association)
 * - ISSN (International Society of Sports Nutrition)
 */

/**
 * Genera recomendaciones científicas basadas en el rendimiento del usuario
 * @param {Object} params - Parámetros del usuario
 * @returns {Array} Array de recomendaciones con prioridad y base científica
 */
function generateScientificRecommendations(params) {
    const {
        user,
        goal,
        weightStats,
        exerciseStats,
        nutritionStats,
        recentActivity,
    } = params;

    const recommendations = [];

    // =================================================================
    // 1. RECOMENDACIONES DE PESO (Basadas en OMS y medicina)
    // =================================================================
    if (goal && weightStats.current && weightStats.initial) {
        const remaining = Math.abs(weightStats.current - parseFloat(goal.target_weight));
        const weeklyChange = weightStats.change ? (weightStats.change / 4.3) : 0; // Cambio por semana (30 días ≈ 4.3 semanas)
        
        // OMS: Pérdida de peso segura es 0.5-1 kg/semana (máximo 1% del peso corporal/semana)
        const safeWeeklyLoss = parseFloat(goal.current_weight) * 0.01; // 1% del peso inicial
        
        if (goal.goalType === 'weight_loss') {
            // Pérdida demasiado rápida (riesgo de pérdida de masa muscular)
            if (weeklyChange < -safeWeeklyLoss) {
                recommendations.push({
                    type: 'weight',
                    priority: 'high',
                    category: 'safety',
                    message: `Estás perdiendo peso demasiado rápido (${Math.abs(weeklyChange).toFixed(2)} kg/semana). La OMS recomienda una pérdida máxima de ${safeWeeklyLoss.toFixed(1)} kg/semana (1% del peso corporal) para preservar la masa muscular. Considera aumentar ligeramente las calorías.`,
                    scientificBasis: 'OMS: Pérdida de peso >1% del peso corporal/semana puede resultar en pérdida de masa muscular y ralentización del metabolismo.',
                });
            }
            // Pérdida muy lenta o estancamiento
            else if (weeklyChange > -0.2 && remaining > 2) {
                recommendations.push({
                    type: 'weight',
                    priority: 'medium',
                    category: 'progress',
                    message: `Tu pérdida de peso es muy lenta (${Math.abs(weeklyChange).toFixed(2)} kg/semana). Para una pérdida efectiva, la OMS recomienda 0.5-1 kg/semana. Considera ajustar tu déficit calórico en 200-300 kcal/día.`,
                    scientificBasis: 'OMS: Pérdida de peso óptima es 0.5-1 kg/semana para resultados sostenibles y preservación de masa muscular.',
                });
            }
            // Pérdida adecuada pero falta mucho
            else if (remaining > 5) {
                recommendations.push({
                    type: 'weight',
                    priority: 'medium',
                    category: 'motivation',
                    message: `Faltan ${remaining.toFixed(1)} kg para tu objetivo. Mantén la consistencia: la pérdida de peso sostenible requiere tiempo. Estás en el camino correcto.`,
                    scientificBasis: 'Estudios muestran que la consistencia a largo plazo es más efectiva que cambios drásticos a corto plazo.',
                });
            }
            // Cerca del objetivo
            else if (remaining <= 2 && remaining > 0.5) {
                recommendations.push({
                    type: 'weight',
                    priority: 'low',
                    category: 'motivation',
                    message: `¡Excelente progreso! Solo faltan ${remaining.toFixed(1)} kg. Mantén tus hábitos actuales para alcanzar tu objetivo.`,
                    scientificBasis: 'La fase final de pérdida de peso requiere mantener la adherencia a largo plazo.',
                });
            }
        }
    }

    // =================================================================
    // 2. RECOMENDACIONES DE EJERCICIO (Basadas en ACSM y AHA)
    // =================================================================
    
    // ACSM/AHA: Mínimo 150 minutos de ejercicio moderado o 75 minutos de intenso por semana
    // Para objetivos de pérdida de peso: 250-300 minutos/semana
    const minWeeklyMinutes = goal && goal.goalType === 'weight_loss' ? 250 : 150;
    const currentWeeklyMinutes = exerciseStats.averageCaloriesPerSession 
        ? (parseFloat(exerciseStats.averageCaloriesPerSession) / 5) * exerciseStats.weeklyFrequency * 30 // Estimación aproximada
        : 0;

    // Frecuencia de ejercicio
    if (exerciseStats.weeklyFrequency < 2) {
        recommendations.push({
            type: 'exercise',
            priority: 'high',
            category: 'health',
            message: `Ejercitaste ${exerciseStats.totalSessions} días en el último mes (${exerciseStats.weeklyFrequency} días/semana). La AHA recomienda al menos 150 minutos de ejercicio moderado por semana (mínimo 2-3 días). Esto reduce el riesgo de enfermedades cardiovasculares en un 30-35%.`,
            scientificBasis: 'AHA/ACSM: Mínimo 150 minutos/semana de ejercicio moderado reduce significativamente el riesgo cardiovascular y mejora la salud metabólica.',
        });
    } else if (exerciseStats.weeklyFrequency < 3 && goal && goal.goalType === 'weight_loss') {
        recommendations.push({
            type: 'exercise',
            priority: 'high',
            category: 'weight_loss',
            message: `Para pérdida de peso efectiva, la ACSM recomienda 250-300 minutos de ejercicio moderado por semana (5-6 días). Actualmente ejercitas ${exerciseStats.weeklyFrequency} días/semana. Aumentar a 5 días acelerará tu progreso.`,
            scientificBasis: 'ACSM: Para pérdida de peso, se recomiendan 250-300 minutos/semana de ejercicio moderado para optimizar el déficit calórico y preservar masa muscular.',
        });
    } else if (exerciseStats.adherence < 60) {
        recommendations.push({
            type: 'exercise',
            priority: 'medium',
            category: 'consistency',
            message: `Tu adherencia al ejercicio es del ${exerciseStats.adherence}%. Estudios muestran que una adherencia >80% es necesaria para resultados óptimos. Intenta mantener una rutina más consistente.`,
            scientificBasis: 'NSCA: La adherencia al ejercicio >80% es crítica para adaptaciones fisiológicas y resultados a largo plazo.',
        });
    }

    // Sobreentrenamiento (más de 7 días/semana sin descanso)
    if (exerciseStats.weeklyFrequency > 7) {
        recommendations.push({
            type: 'exercise',
            priority: 'medium',
            category: 'recovery',
            message: `Ejercitas ${exerciseStats.weeklyFrequency} días/semana sin días de descanso. La NSCA recomienda al menos 1-2 días de descanso por semana para permitir la recuperación muscular y prevenir el sobreentrenamiento.`,
            scientificBasis: 'NSCA: El descanso es esencial para la síntesis de proteínas musculares y la adaptación al entrenamiento. Sin descanso adecuado, aumenta el riesgo de lesiones.',
        });
    }

    // =================================================================
    // 3. RECOMENDACIONES DE NUTRICIÓN (Basadas en USDA, WHO, ISSN)
    // =================================================================
    
    if (nutritionStats.calorieGoal && nutritionStats.averageCaloriesPerDay) {
        const avgDiff = parseFloat(nutritionStats.averageCaloriesPerDay) - parseFloat(nutritionStats.calorieGoal);
        const diffPercent = (avgDiff / parseFloat(nutritionStats.calorieGoal)) * 100;

        // Déficit calórico excesivo (riesgo de pérdida de masa muscular y ralentización metabólica)
        if (goal && goal.goalType === 'weight_loss' && avgDiff < -1000) {
            recommendations.push({
                type: 'nutrition',
                priority: 'high',
                category: 'safety',
                message: `Tu déficit calórico es muy agresivo (${Math.abs(avgDiff).toFixed(0)} kcal/día por debajo del objetivo). La ISSN recomienda un déficit máximo de 500-750 kcal/día para preservar masa muscular. Un déficit mayor puede ralentizar el metabolismo y causar pérdida de masa muscular.`,
                scientificBasis: 'ISSN/USDA: Déficit calórico >1000 kcal/día puede resultar en pérdida significativa de masa muscular, ralentización metabólica y deficiencias nutricionales.',
            });
        }
        // Superávit excesivo (para pérdida de peso)
        else if (goal && goal.goalType === 'weight_loss' && avgDiff > 500) {
            recommendations.push({
                type: 'nutrition',
                priority: 'high',
                category: 'progress',
                message: `Consumes ${avgDiff.toFixed(0)} kcal más de tu objetivo diario. Para pérdida de peso efectiva, la OMS recomienda un déficit de 500-750 kcal/día. Esto resultaría en una pérdida de 0.5-0.75 kg/semana de forma segura.`,
                scientificBasis: 'OMS: Déficit calórico de 500-750 kcal/día resulta en pérdida de peso sostenible de 0.5-0.75 kg/semana sin comprometer la masa muscular.',
            });
        }
        // Déficit adecuado pero inconsistente
        else if (Math.abs(diffPercent) > 20 && nutritionStats.calorieAdherence < 60) {
            recommendations.push({
                type: 'nutrition',
                priority: 'medium',
                category: 'consistency',
                message: `Tu adherencia calórica es del ${nutritionStats.calorieAdherence}% con variaciones del ${Math.abs(diffPercent).toFixed(0)}%. La consistencia nutricional es clave: estudios muestran que variaciones >20% reducen la efectividad del plan. Intenta mantenerte dentro del ±10% de tu objetivo diario.`,
                scientificBasis: 'Estudios nutricionales: La consistencia en la ingesta calórica (±10% del objetivo) es más efectiva que grandes variaciones para resultados a largo plazo.',
            });
        }
    }

    // Proteína insuficiente (si tenemos datos de macronutrientes)
    // ISSN recomienda 1.6-2.2 g/kg de peso corporal para atletas
    // Para pérdida de peso: 2.3-3.1 g/kg para preservar masa muscular
    if (user && user.weight && goal && goal.goalType === 'weight_loss') {
        const userWeight = parseFloat(user.weight);
        if (userWeight > 0) {
            const minProteinGrams = userWeight * 2.3; // Mínimo para preservar masa muscular
            recommendations.push({
                type: 'nutrition',
                priority: 'medium',
                category: 'macronutrients',
                message: `Para preservar masa muscular durante la pérdida de peso, la ISSN recomienda ${minProteinGrams.toFixed(0)}g de proteína diaria (2.3-3.1 g/kg de peso). Asegúrate de incluir fuentes de proteína en cada comida.`,
                scientificBasis: 'ISSN: Durante déficit calórico, ingesta de proteína de 2.3-3.1 g/kg preserva masa muscular y optimiza la composición corporal.',
            });
        }
    }

    // =================================================================
    // 4. RECOMENDACIONES DE RECUPERACIÓN Y PERIODIZACIÓN
    // =================================================================
    
    // Verificar si hay días consecutivos de ejercicio sin descanso
    if (recentActivity.daysWithExercise >= 7) {
        recommendations.push({
            type: 'exercise',
            priority: 'medium',
            category: 'recovery',
            message: `Has ejercitado ${recentActivity.daysWithExercise} días consecutivos. La NSCA recomienda periodización del entrenamiento con días de descanso activo o completo cada 3-4 días para optimizar la recuperación y prevenir el sobreentrenamiento.`,
            scientificBasis: 'NSCA: La periodización y el descanso adecuado son esenciales para la supercompensación y adaptación al entrenamiento.',
        });
    }

    // =================================================================
    // 5. RECOMENDACIONES DE ADHERENCIA GENERAL
    // =================================================================
    
    const overallAdherence = (
        (parseFloat(exerciseStats.adherence || 0) + parseFloat(nutritionStats.calorieAdherence || 0)) / 2
    );

    if (overallAdherence < 50) {
        recommendations.push({
            type: 'general',
            priority: 'high',
            category: 'adherence',
            message: `Tu adherencia general es del ${overallAdherence.toFixed(0)}%. Estudios muestran que una adherencia >80% es necesaria para resultados significativos. La consistencia es más importante que la perfección: pequeños pasos diarios son más efectivos que esfuerzos esporádicos.`,
            scientificBasis: 'Meta-análisis: La adherencia >80% a programas de ejercicio y nutrición es el predictor más fuerte de éxito a largo plazo.',
        });
    }

    // =================================================================
    // 6. RECOMENDACIONES POSITIVAS (Refuerzo)
    // =================================================================
    
    if (overallAdherence >= 80 && weightStats.trend === 'decreasing' && goal && goal.goalType === 'weight_loss') {
        recommendations.push({
            type: 'general',
            priority: 'low',
            category: 'positive',
            message: `¡Excelente trabajo! Tu adherencia del ${overallAdherence.toFixed(0)}% y tendencia de peso descendente indican que estás siguiendo un enfoque científico y sostenible. Mantén esta consistencia.`,
            scientificBasis: 'Estudios de adherencia: Consistencia >80% con tendencia positiva es indicador de éxito a largo plazo.',
        });
    }

    return recommendations;
}

module.exports = {
    generateScientificRecommendations,
};

