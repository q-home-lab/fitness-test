# Usuario de Prueba - Documentación

## Descripción

Este script crea un usuario de prueba completo con datos realistas de 1 mes de uso de la aplicación. Incluye:

- ✅ Usuario con perfil completo (onboarding completado)
- ✅ 3 rutinas de entrenamiento con ejercicios
- ✅ 30 días de registros de peso (con evolución realista)
- ✅ 82 registros de comidas distribuidas en el mes
- ✅ 33 registros de ejercicios completados
- ✅ Objetivo de pérdida de peso configurado

## Credenciales de Acceso

```
Email: usuario.prueba@fitnessapp.com
Password: TestUser123!
```

## Datos Generados

### Perfil del Usuario
- **Género**: Masculino
- **Edad**: 30 años
- **Altura**: 175 cm
- **Peso inicial**: 85 kg
- **Peso objetivo**: 80 kg
- **Objetivo**: Pérdida de peso (-0.5 kg/semana)

### Rutinas Creadas

1. **Rutina de Fuerza - Tren Superior** (Lunes)
   - Press de banca: 4 series x 8 repeticiones (70 kg)
   - Remo con barra: 4 series x 10 repeticiones (60 kg)
   - Press militar: 3 series x 10 repeticiones (40 kg)
   - Flexiones: 3 series x 15 repeticiones

2. **Rutina de Fuerza - Tren Inferior** (Miércoles)
   - Sentadillas: 4 series x 10 repeticiones (80 kg)
   - Peso muerto: 4 series x 8 repeticiones (100 kg)
   - Plancha: 3 series x 1 minuto

3. **Rutina Cardio** (Viernes)
   - Correr: 30 minutos
   - Burpees: 3 series x 20 repeticiones
   - Jumping Jacks: 3 series x 2 minutos

### Evolución de Peso

El script genera una evolución de peso realista durante 30 días:
- **Pérdida promedio**: ~0.3 kg por semana
- **Variación diaria**: ±0.3 kg (fluctuaciones normales)
- **Tendencia**: Descendente hacia el objetivo

### Registros de Comidas

- **Alimentos incluidos**: 12 alimentos comunes (pollo, arroz, brócoli, huevos, avena, plátano, salmón, pasta, yogur, pan, pavo, quinoa)
- **Comidas por día**: 3-4 comidas (Desayuno, Almuerzo, Cena, Snack)
- **Cobertura**: ~80% de los días tienen comidas registradas
- **Total**: 82 registros de comidas

### Registros de Ejercicios

- **Ejercicios completados**: Basados en las rutinas programadas
- **Frecuencia**: ~60% de los días tienen ejercicios registrados
- **Distribución**: Lunes (Tren Superior), Miércoles (Tren Inferior), Viernes (Cardio)
- **Total**: 33 registros de ejercicios

## Cómo Ejecutar el Script

```bash
# Desde el directorio fitness-app-backend
npm run create:test-user
```

O directamente:

```bash
node scripts/create-test-user.js
```

## Notas Importantes

1. **Reutilización**: Si el usuario ya existe, el script eliminará todos sus datos anteriores y creará nuevos datos.

2. **Ejercicios y Alimentos**: El script crea los ejercicios y alimentos si no existen en la base de datos. Si ya existen, los reutiliza.

3. **Datos Realistas**: Los datos generados incluyen variaciones realistas:
   - Fluctuaciones de peso diarias
   - Variación en la cantidad de comidas
   - Días sin ejercicio (descanso)
   - Variación en calorías quemadas

4. **Evolución Temporal**: Los datos se generan para los últimos 30 días desde la fecha actual.

## Uso para Testing

Este usuario de prueba es ideal para:
- ✅ Probar la visualización de gráficas de peso
- ✅ Verificar el dashboard con datos reales
- ✅ Probar la funcionalidad de rutinas
- ✅ Validar el registro de comidas y ejercicios
- ✅ Probar la funcionalidad de objetivos
- ✅ Verificar la evolución temporal de datos

## Limpieza de Datos

Si necesitas eliminar el usuario de prueba y todos sus datos:

```sql
-- Ejecutar en la base de datos
DELETE FROM daily_exercises WHERE log_id IN (SELECT log_id FROM daily_logs WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com'));
DELETE FROM meal_items WHERE log_id IN (SELECT log_id FROM daily_logs WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com'));
DELETE FROM daily_logs WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com');
DELETE FROM routine_exercises WHERE routine_id IN (SELECT routine_id FROM routines WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com'));
DELETE FROM routines WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com');
DELETE FROM user_goals WHERE user_id = (SELECT user_id FROM users WHERE email = 'usuario.prueba@fitnessapp.com');
DELETE FROM users WHERE email = 'usuario.prueba@fitnessapp.com';
```

O simplemente ejecutar el script nuevamente, que eliminará y recreará los datos.

