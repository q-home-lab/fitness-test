# Guía de Generación Automática de Rutinas y Planes de Comidas

## Descripción

Sistema automático para generar rutinas de entrenamiento de 5 días y planes de comidas de 7 días basados en el objetivo del usuario.

## Funcionalidades Implementadas

### 1. Generación Automática de Rutinas (5 días)

**Endpoint**: `POST /api/admin/users/:userId/generate-routine`

**Características**:
- Genera rutinas de 5 días combinando cardio y fuerza
- Adapta la distribución según el objetivo del usuario:
  - **Pérdida de peso**: 2 días fuerza + 3 días cardio
  - **Ganancia muscular**: 3 días fuerza + 2 días cardio
  - **Mantenimiento**: 3 días fuerza + 2 días cardio

**Distribución de la semana**:
- **Lunes**: Fuerza
- **Martes**: Cardio
- **Miércoles**: Fuerza
- **Jueves**: Cardio
- **Viernes**: Fuerza (o Cardio si es pérdida de peso)

**Ejercicios generados**:
- **Días de fuerza**: 4-6 ejercicios, 3-4 series, 8-12 repeticiones
  - Para ganancia: 4 series × 8 reps (hipertrofia)
  - Para pérdida: 3 series × 12 reps (resistencia)
- **Días de cardio**: 2-3 ejercicios, 20-40 minutos
  - Para pérdida: 40 minutos
  - Para ganancia: 20 minutos

**Estimación de peso inicial**:
- Basada en porcentajes del peso corporal (principios NSCA)
- Press banca: 60% del peso corporal
- Sentadillas: 80% del peso corporal
- Peso muerto: 100% del peso corporal
- Remo: 50% del peso corporal
- Press militar: 40% del peso corporal

### 2. Generación Automática de Planes de Comidas (7 días)

**Endpoint**: `POST /api/admin/users/:userId/generate-meal-plan`

**Características**:
- Genera planes de comidas para los 7 días de la semana
- Calcula macronutrientes según objetivo:
  - **Pérdida de peso**: 30% proteína, 40% carbohidratos, 30% grasa
  - **Ganancia muscular**: 25% proteína, 50% carbohidratos, 25% grasa
  - **Mantenimiento**: 25% proteína, 45% carbohidratos, 30% grasa

**Distribución calórica diaria**:
- Desayuno: 25% de las calorías diarias
- Comida: 35% de las calorías diarias
- Cena: 30% de las calorías diarias
- Snacks: 10% de las calorías diarias

**Selección de alimentos**:
- Categoriza alimentos por tipo (proteína, carbohidratos, verduras, grasas saludables)
- Selecciona alimentos variados para evitar monotonía
- Ajusta cantidades según necesidades calóricas

## Uso en AdminDashboard

### Generar Rutina Automática

1. Selecciona un usuario en la lista
2. En la sección "Rutinas asignadas", haz clic en "✨ Generar Rutina 5 Días"
3. El sistema generará y creará automáticamente una rutina completa

### Generar Plan de Comidas Automático

1. Selecciona un usuario en la lista
2. En la sección "Plan de comidas semanal", haz clic en "🍽️ Generar Plan 7 Días"
3. El sistema generará y guardará automáticamente un plan para toda la semana

## Bases Científicas

### Rutinas

- **NSCA**: Principios de periodización y distribución de entrenamiento
- **ACSM**: Frecuencia y volumen óptimo según objetivos
- **Principio de sobrecarga progresiva**: Estimación de pesos iniciales

### Planes de Comidas

- **USDA**: Guías nutricionales y distribución de macronutrientes
- **ISSN**: Recomendaciones de proteína para objetivos específicos
- **OMS**: Distribución calórica diaria saludable

## Requisitos

- El usuario debe tener un objetivo activo configurado (opcional pero recomendado)
- Debe haber ejercicios disponibles en la base de datos (categorías: Fuerza, Cardio)
- Debe haber alimentos disponibles en la base de datos

## Personalización

Las rutinas y planes se adaptan automáticamente a:
- Objetivo del usuario (pérdida, ganancia, mantenimiento)
- Peso actual del usuario (para estimar pesos de ejercicios)
- Calorías objetivo (para planes de comidas)

## Notas

- Las rutinas generadas se crean como nuevas rutinas activas
- Los planes de comidas actualizan o crean planes para los 7 días
- Los ejercicios y alimentos se seleccionan aleatoriamente de los disponibles
- Se puede regenerar múltiples veces para obtener variaciones

