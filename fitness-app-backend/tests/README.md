# Tests del Backend

Este directorio contiene todos los tests unitarios e integración del backend.

## Configuración

Los tests requieren:
1. Una base de datos PostgreSQL de pruebas
2. Variables de entorno configuradas (ver `.env.test.example` o `setup.js`)

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar un archivo de test específico
npx jest tests/auth.test.js
```

## Estructura de Tests

Cada archivo de test corresponde a un módulo del backend:

- `auth.test.js` - Tests de autenticación (registro, login)
- `logs.test.js` - Tests de logs diarios
- `foods.test.js` - Tests de gestión de alimentos
- `mealItems.test.js` - Tests de registro de comidas
- `exercises.test.js` - Tests de ejercicios
- `routines.test.js` - Tests de rutinas de entrenamiento
- `workouts.test.js` - Tests de registro de entrenamientos
- `profile.test.js` - Tests del perfil de usuario

## Limpieza de Datos

Los tests están diseñados para limpiar automáticamente los datos de prueba después de ejecutarse. Cada test:
- Crea datos temporales en `beforeAll`
- Limpia los datos en `afterAll`

## Notas Importantes

- Los tests utilizan usuarios de prueba con emails únicos
- Cada suite de tests utiliza sus propios datos para evitar conflictos
- Se recomienda usar una base de datos separada para testing

