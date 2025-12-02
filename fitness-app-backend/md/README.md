# Fitness App Backend

Backend de la aplicación de fitness desarrollado con Express.js y Drizzle ORM.

## Requisitos Previos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio y navegar al directorio del backend:
```bash
cd fitness-app-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos
JWT_SECRET=tu-secret-key-super-segura
PORT=4000
```

4. Generar y ejecutar migraciones de base de datos:

```bash
# Generar migraciones basadas en el schema
npm run db:generate

# Ejecutar migraciones en la base de datos
npm run db:migrate
```

## Ejecutar el Servidor

```bash
node index.js
```

El servidor se iniciará en `http://localhost:4000` (o el puerto especificado en `.env`).

## Testing

Para ejecutar los tests:

```bash
npm test
```

Para ejecutar los tests en modo watch:

```bash
npm run test:watch
```

**Nota importante para testing:**

Antes de ejecutar los tests, asegúrate de tener:
1. Una base de datos de prueba configurada en `DATABASE_URL`
2. O crear un archivo `.env.test` con configuración de base de datos de pruebas
3. El archivo `setup.js` configurará automáticamente las variables de entorno de prueba

## Estructura del Proyecto

```
fitness-app-backend/
├── db/
│   ├── db_config.js      # Configuración de conexión a base de datos
│   ├── schema.js          # Esquema de tablas con Drizzle ORM
│   └── migrate.js         # Script de migración
├── routes/
│   ├── auth.js            # Rutas de autenticación (registro/login)
│   ├── authMiddleware.js  # Middleware de autenticación JWT
│   ├── logs.js            # Rutas de logs diarios
│   ├── foods.js           # Rutas de alimentos
│   ├── mealItems.js       # Rutas de ítems de comida
│   ├── exercises.js       # Rutas de ejercicios
│   ├── routines.js        # Rutas de rutinas
│   └── workouts.js        # Rutas de entrenamientos
├── tests/
│   ├── setup.js           # Configuración inicial para tests
│   ├── auth.test.js       # Tests de autenticación
│   ├── logs.test.js       # Tests de logs
│   ├── foods.test.js      # Tests de alimentos
│   ├── mealItems.test.js  # Tests de meal items
│   ├── exercises.test.js  # Tests de ejercicios
│   ├── routines.test.js   # Tests de rutinas
│   ├── workouts.test.js   # Tests de entrenamientos
│   └── profile.test.js    # Tests de perfil
├── index.js               # Archivo principal del servidor
├── package.json           # Dependencias y scripts
└── jest.config.js         # Configuración de Jest para testing
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Perfil
- `GET /api/profile` - Obtener perfil del usuario autenticado

### Logs Diarios
- `POST /api/logs` - Crear o actualizar log diario
- `GET /api/logs/:date` - Obtener log diario por fecha

### Alimentos
- `POST /api/foods` - Crear nuevo alimento
- `GET /api/foods/search?name=...` - Buscar alimentos por nombre

### Meal Items
- `POST /api/meal-items` - Registrar alimento consumido

### Ejercicios
- `POST /api/exercises` - Crear nuevo ejercicio
- `GET /api/exercises` - Listar ejercicios públicos

### Rutinas
- `POST /api/routines` - Crear nueva rutina
- `GET /api/routines` - Listar rutinas del usuario
- `GET /api/routines/:routineId` - Obtener detalles de rutina
- `PUT /api/routines/:routineId` - Actualizar rutina
- `DELETE /api/routines/:routineId` - Desactivar rutina
- `POST /api/routines/:routineId/exercises` - Añadir ejercicio a rutina
- `DELETE /api/routines/:routineId/exercises/:exerciseId` - Eliminar ejercicio de rutina

### Entrenamientos
- `POST /api/workouts/log` - Registrar ejercicio completado

## Tecnologías Utilizadas

- **Express.js** - Framework web para Node.js
- **Drizzle ORM** - ORM tipo-safe para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación mediante tokens
- **bcrypt** - Hash de contraseñas
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs HTTP

## Notas de Desarrollo

- Todas las rutas protegidas requieren un token JWT válido en el header `Authorization: Bearer <token>`
- Las contraseñas se hashean usando bcrypt antes de almacenarse
- Los tokens JWT expiran después de 7 días
- El proyecto utiliza Drizzle ORM para manejar la base de datos de manera type-safe

