# Sistema de Recomendaciones Científicas

## Descripción

Este módulo genera recomendaciones personalizadas basadas en evidencia científica de organizaciones oficiales de medicina, nutrición y deporte de élite.

## Referencias Científicas Utilizadas

### Organizaciones de Salud
- **OMS (Organización Mundial de la Salud)**: Pérdida de peso segura, actividad física
- **ACSM (American College of Sports Medicine)**: Frecuencia y volumen de ejercicio
- **AHA (American Heart Association)**: Actividad física cardiovascular mínima

### Nutrición
- **USDA (United States Department of Agriculture)**: Guías nutricionales
- **ISSN (International Society of Sports Nutrition)**: Proteína y macronutrientes para atletas

### Deporte de Élite
- **NSCA (National Strength and Conditioning Association)**: Periodización, recuperación, sobreentrenamiento

## Criterios Científicos Implementados

### 1. Pérdida de Peso (OMS)

**Criterio**: Pérdida de peso segura es 0.5-1 kg/semana (máximo 1% del peso corporal/semana)

**Recomendaciones generadas**:
- ⚠️ **Alta prioridad**: Si pérdida >1% peso/semana → Riesgo de pérdida de masa muscular
- 💡 **Media prioridad**: Si pérdida <0.2 kg/semana → Progreso muy lento
- ✅ **Baja prioridad**: Si pérdida 0.5-1 kg/semana → Progreso óptimo

**Base científica**: 
> OMS establece que pérdida de peso >1% del peso corporal/semana puede resultar en pérdida de masa muscular y ralentización del metabolismo.

### 2. Actividad Física (AHA/ACSM)

**Criterios**:
- **Mínimo salud**: 150 minutos/semana de ejercicio moderado (reduce riesgo cardiovascular 30-35%)
- **Pérdida de peso**: 250-300 minutos/semana (5-6 días)
- **Adherencia óptima**: >80% para resultados significativos

**Recomendaciones generadas**:
- ⚠️ **Alta prioridad**: Si <2 días/semana → Riesgo cardiovascular aumentado
- ⚠️ **Alta prioridad**: Si <5 días/semana y objetivo pérdida de peso → Progreso subóptimo
- 💡 **Media prioridad**: Si adherencia <60% → Consistencia mejorable
- 💡 **Media prioridad**: Si >7 días/semana sin descanso → Riesgo de sobreentrenamiento

**Base científica**:
> AHA/ACSM: Mínimo 150 minutos/semana reduce significativamente el riesgo cardiovascular. Para pérdida de peso, se requieren 250-300 minutos/semana.

### 3. Nutrición (USDA/ISSN)

**Criterios**:
- **Déficit seguro**: 500-750 kcal/día máximo (0.5-0.75 kg/semana)
- **Déficit excesivo**: >1000 kcal/día → Riesgo de pérdida de masa muscular
- **Consistencia**: Variaciones <10% del objetivo diario
- **Proteína (pérdida de peso)**: 2.3-3.1 g/kg de peso corporal

**Recomendaciones generadas**:
- ⚠️ **Alta prioridad**: Si déficit >1000 kcal/día → Riesgo de pérdida muscular
- ⚠️ **Alta prioridad**: Si superávit >500 kcal/día y objetivo pérdida → Progreso comprometido
- 💡 **Media prioridad**: Si variaciones >20% → Consistencia mejorable
- 💡 **Media prioridad**: Recordatorio de ingesta de proteína adecuada

**Base científica**:
> ISSN/USDA: Déficit calórico >1000 kcal/día puede resultar en pérdida significativa de masa muscular y ralentización metabólica. Durante déficit, proteína de 2.3-3.1 g/kg preserva masa muscular.

### 4. Recuperación y Periodización (NSCA)

**Criterios**:
- **Descanso mínimo**: 1-2 días/semana
- **Sobreentrenamiento**: >7 días consecutivos sin descanso

**Recomendaciones generadas**:
- 💡 **Media prioridad**: Si >7 días consecutivos → Riesgo de sobreentrenamiento

**Base científica**:
> NSCA: El descanso es esencial para la síntesis de proteínas musculares y la adaptación al entrenamiento. Sin descanso adecuado, aumenta el riesgo de lesiones.

### 5. Adherencia General

**Criterios**:
- **Óptima**: >80% para resultados significativos
- **Subóptima**: <50% requiere intervención

**Recomendaciones generadas**:
- ⚠️ **Alta prioridad**: Si adherencia <50% → Intervención necesaria
- ✅ **Baja prioridad**: Si adherencia >80% y tendencia positiva → Refuerzo positivo

**Base científica**:
> Meta-análisis: La adherencia >80% a programas de ejercicio y nutrición es el predictor más fuerte de éxito a largo plazo.

## Estructura de Recomendaciones

Cada recomendación incluye:

```javascript
{
    type: 'weight' | 'exercise' | 'nutrition' | 'general',
    priority: 'high' | 'medium' | 'low',
    category: 'safety' | 'progress' | 'consistency' | 'health' | 'recovery' | 'motivation' | 'positive',
    message: 'Mensaje personalizado para el usuario',
    scientificBasis: 'Referencia científica específica'
}
```

## Prioridades

- **Alta (high)**: Riesgo para la salud, progreso comprometido, requiere acción inmediata
- **Media (medium)**: Mejora recomendada, optimización de resultados
- **Baja (low)**: Refuerzo positivo, mantenimiento

## Categorías

- **safety**: Relacionado con seguridad y salud
- **progress**: Relacionado con progreso hacia objetivos
- **consistency**: Relacionado con adherencia y consistencia
- **health**: Relacionado con salud general
- **recovery**: Relacionado con recuperación y descanso
- **motivation**: Relacionado con motivación y refuerzo
- **positive**: Refuerzo positivo para buen rendimiento

## Ejemplos de Recomendaciones

### Ejemplo 1: Pérdida de peso demasiado rápida
```
Tipo: weight
Prioridad: high
Categoría: safety
Mensaje: "Estás perdiendo peso demasiado rápido (1.2 kg/semana). 
         La OMS recomienda una pérdida máxima de 0.85 kg/semana 
         (1% del peso corporal) para preservar la masa muscular."
Base científica: "OMS: Pérdida de peso >1% del peso corporal/semana 
                   puede resultar en pérdida de masa muscular y 
                   ralentización del metabolismo."
```

### Ejemplo 2: Frecuencia de ejercicio insuficiente
```
Tipo: exercise
Prioridad: high
Categoría: health
Mensaje: "Ejercitaste 8 días en el último mes (1.9 días/semana). 
         La AHA recomienda al menos 150 minutos de ejercicio 
         moderado por semana (mínimo 2-3 días). Esto reduce el 
         riesgo de enfermedades cardiovasculares en un 30-35%."
Base científica: "AHA/ACSM: Mínimo 150 minutos/semana de ejercicio 
                   moderado reduce significativamente el riesgo 
                   cardiovascular y mejora la salud metabólica."
```

## Validación Científica

Todas las recomendaciones están basadas en:
1. Guías oficiales de organizaciones reconocidas
2. Meta-análisis y revisiones sistemáticas
3. Estudios longitudinales con evidencia sólida
4. Consenso de expertos en medicina, nutrición y deporte

## Mantenimiento

Este módulo debe actualizarse cuando:
- Nuevas guías oficiales sean publicadas
- Nuevos meta-análisis cambien las recomendaciones
- Se identifiquen mejores prácticas basadas en evidencia

## Referencias Bibliográficas (Resumen)

1. **OMS**: Guías sobre actividad física y pérdida de peso segura
2. **ACSM**: Position Stand on Exercise and Physical Activity
3. **AHA**: Physical Activity Guidelines for Americans
4. **ISSN**: Position Stand on Protein and Exercise
5. **NSCA**: Essentials of Strength Training and Conditioning
6. **USDA**: Dietary Guidelines for Americans

