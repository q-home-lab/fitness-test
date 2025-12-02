# Uso de Endpoints de wger API

Este documento describe cómo se utilizan los diferentes endpoints de la API de wger en la aplicación.

## Endpoints Utilizados

### 1. `/api/v2/exerciseinfo/` - Información de Ejercicios
**Propósito:** Obtener información completa de ejercicios incluyendo nombres y traducciones.

**Uso:**
- Sincronización masiva de ejercicios
- Obtiene nombres en español desde el campo `translations`
- Incluye categorías, músculos, equipamiento

**Parámetros:**
- `language`: 2 (inglés/español) o 4 (español específico)
- `limit`: 100 (máximo por página)
- `offset`: Para paginación

**Campos importantes:**
- `id`: ID del ejercicio
- `translations[]`: Array de traducciones con `name`, `description`, `language`
- `category.name`: Nombre de la categoría
- `muscles[]`: Músculos trabajados
- `equipment[]`: Equipamiento necesario

### 2. `/api/v2/exerciseimage/` - Imágenes de Ejercicios
**Propósito:** Obtener imágenes/GIFs que muestran cómo realizar los ejercicios.

**Uso:**
- Sincronización de imágenes al inicio del proceso
- Buscar imágenes para ejercicios específicos

**Parámetros:**
- `exercise`: ID del ejercicio (opcional, para filtrar)
- `is_main`: true para obtener solo imágenes principales
- `limit`: 100 (máximo por página)
- `offset`: Para paginación

**Estructura de respuesta:**
```json
{
  "exercise": 167,
  "image": "https://wger.de/media/exercise-images/91/Crunches-1.png",
  "is_main": true
}
```

**Total disponible:** 289 imágenes

### 3. `/api/v2/video/` - Videos de Ejercicios
**Propósito:** Obtener videos de demostración de ejercicios.

**Uso:**
- Obtener videos para ejercicios específicos
- Mejorar la experiencia de usuario con demostraciones en video

**Parámetros:**
- `exercise`: ID del ejercicio (opcional, para filtrar)
- `limit`: 100 (máximo por página)
- `offset`: Para paginación

**Estructura de respuesta:**
```json
{
  "exercise": 512,
  "video": "https://wger.de/media/exercise-video/512/fff4c294-93f0-4926-b3a2-bf59ad4afaa5.MOV",
  "duration": "10.49",
  "width": 1920,
  "height": 1080
}
```

**Total disponible:** 78 videos

### 4. `/api/v2/exercise/` - Lista de Ejercicios
**Propósito:** Obtener lista básica de ejercicios (sin nombres directamente).

**Uso:**
- Búsqueda de ejercicios por término
- Verificación de existencia de ejercicios

**Parámetros:**
- `language`: 2 (para filtrar por idioma)
- `term`: Término de búsqueda
- `limit`: 100 (máximo por página)
- `offset`: Para paginación

**Nota:** Este endpoint no devuelve nombres directamente, por eso usamos `exerciseinfo`.

### 5. `/api/v2/exercise/{id}/` - Detalles de un Ejercicio
**Propósito:** Obtener detalles básicos de un ejercicio específico.

**Uso:**
- Obtener categoría y metadatos de un ejercicio
- Verificar existencia de un ejercicio

**Nota:** No incluye nombres directamente, necesita combinarse con `exerciseinfo`.

## Estrategia de Sincronización

### Fase 1: Preparación
1. Obtener todas las imágenes disponibles desde `/exerciseimage/` y crear un mapa
2. (Opcional) Obtener todos los videos desde `/video/` y crear un mapa

### Fase 2: Sincronización
1. Iterar por todas las páginas de `/exerciseinfo/`
2. Para cada ejercicio:
   - Extraer nombre en español desde `translations`
   - Buscar imagen en el mapa creado
   - Buscar video en el mapa creado (opcional)
   - Guardar o actualizar en la base de datos

### Ventajas de esta Estrategia
- **Más eficiente:** Una sola pasada por las imágenes en lugar de una consulta por ejercicio
- **Completo:** Obtiene todas las imágenes disponibles
- **Rápido:** Reduce significativamente el número de llamadas API
- **Completo:** No se pierden imágenes

## Mejoras Futuras

1. **Agregar campo `video_url` al schema** para almacenar videos de demostración
2. **Cachear imágenes localmente** para reducir dependencia de wger
3. **Actualización incremental** para solo sincronizar cambios
4. **Paralelización** para procesar múltiples ejercicios simultáneamente

