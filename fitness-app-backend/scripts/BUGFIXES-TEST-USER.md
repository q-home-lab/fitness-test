# Correcciones de Bugs - Script create-test-user.js

## Errores Encontrados y Corregidos

### 1. ❌ BUG CRÍTICO: Cálculo incorrecto de calorías para ejercicios con duración
**Problema**: El script multiplicaba `duration_minutes * sets_done`, lo cual es incorrecto porque `duration_minutes` ya representa la duración total del ejercicio, no por serie.

**Ejemplo del error**:
- Ejercicio "Correr": `sets: 1, duration_minutes: 30`
- Cálculo incorrecto: `30 * 1 = 30 minutos` (casualmente correcto pero por la razón equivocada)
- Ejercicio "Jumping Jacks": `sets: 3, duration_minutes: 2`
- Cálculo incorrecto: `2 * 3 = 6 minutos` (incorrecto si 2 minutos es el total)

**Corrección**: 
- Ahora `duration_minutes` se usa directamente como duración total
- Basado en el código del frontend (`ExerciseSearchAndAdd.jsx` línea 147)
- Corregida la rutina "Jumping Jacks" para usar `duration_minutes: 6` (total)

**Código corregido**:
```javascript
if (duration_minutes) {
    // Ejercicio de duración: duration_minutes es la duración TOTAL
    burnedCalories = parseFloat(exercise.default_calories_per_minute) * duration_minutes;
}
```

---

### 2. ❌ BUG: Cálculo poco realista de calorías para ejercicios de fuerza
**Problema**: El cálculo original usaba `0.5 kcal por repetición`, lo cual es muy bajo y poco realista.

**Ejemplo del error**:
- Press de banca: 4 series × 8 repeticiones = 32 repeticiones
- Cálculo incorrecto: `32 * 0.5 = 16 kcal` (muy bajo)

**Corrección**:
- Nuevo cálculo considera el peso del usuario y el peso levantado
- Fórmula: `(peso_usuario + peso_levantado) * 0.1 * repeticiones`
- Ejemplo: `(85kg + 70kg) * 0.1 * 32 = 496 kcal` (más realista)

**Código corregido**:
```javascript
else if (reps_done) {
    const totalReps = sets_done * reps_done;
    const userWeight = 85; // Peso estimado del usuario
    const totalWeight = userWeight + (weight_kg || 0);
    burnedCalories = totalReps * totalWeight * 0.1;
}
```

---

### 3. ⚠️ MEJORA: Manejo de arrays vacíos en eliminación de datos
**Problema**: Si `logIds` o `routineIds` estaban vacíos, `inArray()` podría fallar o comportarse de manera inesperada.

**Corrección**: Agregada verificación explícita de arrays no vacíos antes de usar `inArray()`.

**Código corregido**:
```javascript
if (logIds && logIds.length > 0) {
    await db.delete(dailyExercises).where(inArray(dailyExercises.log_id, logIds));
    // ...
}
```

---

### 4. ⚠️ MEJORA: Manejo de ejercicios que no existen en el mapa
**Problema**: Si un ejercicio en la rutina no existe en `exerciseMap`, simplemente se saltaba sin advertencia, lo que podría causar confusión.

**Corrección**: Agregada advertencia en consola cuando un ejercicio no se encuentra.

**Código corregido**:
```javascript
if (!exercise) {
    console.warn(`⚠️  Ejercicio "${ex.name}" no encontrado en el mapa de ejercicios. Se omite.`);
    return;
}
```

---

### 5. ✅ MEJORA: Prevención de logs duplicados por fecha
**Problema**: Si el script se ejecutaba múltiples veces, podría intentar crear logs duplicados para la misma fecha, causando error por la restricción `unique(user_id, date)`.

**Corrección**: Agregada verificación de logs existentes antes de crear uno nuevo. Si existe, se actualiza en lugar de crear uno nuevo.

**Código corregido**:
```javascript
const existingLog = await db.select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.user_id, userId), eq(dailyLogs.date, dateStr)))
    .limit(1);

let logId;
if (existingLog.length > 0) {
    // Actualizar log existente
    await db.update(dailyLogs)
        .set({ weight: weight.toFixed(2), ... })
        .where(eq(dailyLogs.log_id, existingLog[0].log_id));
    logId = existingLog[0].log_id;
} else {
    // Crear nuevo log
    const log = await db.insert(dailyLogs).values({...}).returning();
    logId = log[0].log_id;
}
```

---

### 6. ✅ MEJORA: Corrección de rutina "Jumping Jacks"
**Problema**: La rutina tenía `sets: 3, duration_minutes: 2`, lo cual era ambiguo (¿2 minutos por serie o total?).

**Corrección**: Cambiado a `sets: 1, duration_minutes: 6` para clarificar que son 6 minutos totales.

---

## Resumen de Cambios

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Bugs críticos | 1 | ✅ Corregido |
| Bugs menores | 1 | ✅ Corregido |
| Mejoras | 4 | ✅ Implementadas |

## Impacto

- **Cálculo de calorías**: Ahora más preciso y realista
- **Robustez**: El script maneja mejor casos edge
- **Mantenibilidad**: Código más claro y con mejor manejo de errores
- **Consistencia**: Los cálculos coinciden con la lógica del frontend

## Pruebas Recomendadas

1. Ejecutar el script y verificar que los cálculos de calorías sean razonables
2. Verificar que no haya errores al ejecutar el script múltiples veces
3. Revisar los datos generados en la base de datos
4. Verificar que las gráficas muestren datos coherentes

