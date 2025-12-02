# Integración con la API de wger

Este documento describe la integración de la aplicación con la API de wger para obtener ejercicios e imágenes.

## Referencias

- Documentación oficial de wger API: https://wger.readthedocs.io/en/latest/api/api.html
- API pública de wger: https://wger.de/api/v2

## Características implementadas

### 1. Búsqueda de ejercicios

El endpoint `/api/exercises/search` ahora busca ejercicios en:
- Base de datos local (prioridad)
- API de wger (como complemento)

**Ejemplo de uso:**
```javascript
GET /api/exercises/search?name=push
```

La búsqueda combina resultados de ambas fuentes, eliminando duplicados.

### 2. Obtención de imágenes/GIFs

El endpoint `/api/exercises/gif` obtiene imágenes de ejercicios desde:
- Base de datos local (si ya está guardado)
- API de wger (imágenes oficiales)

**Ejemplos de uso:**
```javascript
// Por nombre
GET /api/exercises/gif?name=push+up

// Por ID de wger (más eficiente)
GET /api/exercises/gif?wger_id=345
```

### 3. Endpoints de wger utilizados

- **Búsqueda de ejercicios:**
  - `GET https://wger.de/api/v2/exercise/?language=es&search=<término>`

- **Obtener imágenes:**
  - `GET https://wger.de/api/v2/exerciseimage/?exercise=<id>&is_main=True`

## Mapeo de categorías

Las categorías de wger (IDs numéricos) se mapean a categorías locales:
- `8` (Arms) → `Fuerza`
- `10` (Abs) → `Fuerza`
- `11` (Back) → `Fuerza`
- `12` (Calves) → `Cardio`
- `13` (Chest) → `Fuerza`
- `14` (Legs) → `Fuerza`
- `15` (Shoulders) → `Cardio`
- Otras → `Fuerza` (por defecto)

## Ventajas de usar wger

1. **Base de datos extensa**: Miles de ejercicios con imágenes
2. **Idioma español**: Soporte nativo para ejercicios en español
3. **Imágenes oficiales**: Imágenes de demostración de alta calidad
4. **API pública**: No requiere autenticación para consultas básicas
5. **Actualizaciones automáticas**: Los datos se mantienen actualizados en wger

## Flujo de trabajo

1. **Búsqueda de ejercicios:**
   - El usuario busca un ejercicio
   - Se consultan primero los ejercicios locales
   - Se complementa con resultados de wger
   - Los resultados se combinan y se presentan al usuario

2. **Obtención de imágenes:**
   - Si el ejercicio tiene `wger_id`, se busca directamente
   - Si no, se busca por nombre en wger para obtener el ID
   - Se obtienen las imágenes principales del ejercicio
   - La imagen se guarda en la base de datos local para futuras consultas

## Notas importantes

- La API de wger es pública y no requiere autenticación para consultas de ejercicios
- Las imágenes se obtienen directamente desde los servidores de wger
- Se recomienda usar `wger_id` cuando esté disponible para búsquedas más eficientes
- Los ejercicios de wger tienen el campo `source: 'wger'` para identificarlos

