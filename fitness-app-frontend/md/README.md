# Fitness App Frontend

Frontend de la aplicación de fitness desarrollado con React, Vite y Tailwind CSS.

## Características Principales

### 🎯 Búsqueda y Selección de Ejercicios Mejorada

- **Autocompletar**: Busca ejercicios mientras escribes
- **GIFs de Ejercicios**: Visualiza cómo hacer cada ejercicio con GIFs animados
- **Búsqueda Inteligente**: Encuentra ejercicios rápidamente por nombre o categoría

### 📊 Seguimiento de Progreso

- Registro diario de peso
- Seguimiento de calorías consumidas y quemadas
- Historial de comidas
- Análisis de macronutrientes

### 🏋️ Gestión de Rutinas

- Crear y editar rutinas personalizadas
- Añadir ejercicios con visualización de GIFs
- Configurar sets, reps, peso y duración

## Instalación

```bash
cd fitness-app-frontend
npm install
```

## Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne).

## Estructura del Proyecto

```
fitness-app-frontend/
├── src/
│   ├── components/
│   │   ├── ExerciseSearchAndAdd.jsx  # Búsqueda de ejercicios con autocompletar y GIFs
│   │   ├── FoodSearchAndAdd.jsx      # Búsqueda de alimentos
│   │   ├── Navbar.jsx                # Barra de navegación
│   │   ├── RoutinesPage.jsx          # Página de rutinas
│   │   └── WeightForm.jsx            # Formulario de peso
│   ├── contexts/
│   │   └── AuthContext.jsx           # Contexto de autenticación
│   ├── services/
│   │   └── api.js                    # Cliente Axios configurado
│   ├── App.jsx                       # Componente principal
│   ├── Dashboard.jsx                 # Panel principal
│   ├── RoutineDetailPage.jsx         # Detalle de rutina (con GIFs)
│   └── main.jsx                      # Punto de entrada
├── package.json
└── vite.config.js
```

## Funcionalidades Mejoradas

### ExerciseSearchAndAdd Component

Este componente incluye:

1. **Búsqueda con Autocompletar**:
   - Busca ejercicios mientras escribes
   - Muestra resultados en tiempo real
   - Debounce de 300ms para optimizar peticiones

2. **Visualización de GIFs**:
   - Muestra GIF animado del ejercicio seleccionado
   - Integración con Giphy API
   - Placeholder si no hay GIF disponible

3. **Información del Ejercicio**:
   - Nombre y categoría
   - Calorías estimadas por minuto
   - Formulario para configurar sets, reps, peso y duración

### Mejoras en RoutineDetailPage

- Botón "Ver GIF" en cada ejercicio de la rutina
- Modal con GIF animado del ejercicio
- Visualización clara de cómo realizar cada ejercicio

## Tecnologías Utilizadas

- **React 19** - Framework de UI
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **DaisyUI** - Componentes UI
- **Vite** - Build tool y dev server

## Configuración

Asegúrate de que el backend esté corriendo en `http://localhost:4000` o actualiza la URL en `src/services/api.js`.

Para habilitar GIFs de ejercicios, configura las API keys en el backend (ver `fitness-app-backend/API_KEYS_SETUP.md`).
