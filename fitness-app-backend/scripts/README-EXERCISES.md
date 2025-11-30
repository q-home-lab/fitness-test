# 📋 Scripts de Gestión de Ejercicios

Este directorio contiene scripts para gestionar, validar y sincronizar los ejercicios en la base de datos.

## 🎯 Objetivo

Almacenar ejercicios con sus imágenes y videos en la base de datos local para evitar consultas repetidas a la API de wger, mejorando el rendimiento de la aplicación.

## 📝 Scripts Disponibles

### 1. `check-exercises-db.js`
**Revisa el estado actual de la base de datos de ejercicios.**

```bash
node scripts/check-exercises-db.js
```

**Muestra:**
- Total de ejercicios
- Ejercicios con imágenes/videos
- Ejercicios sin media
- Distribución por categorías
- Ejercicios duplicados
- URLs problemáticas
- Ejercicios que necesitan atención

### 2. `clean-invalid-exercises.js`
**Limpia ejercicios inválidos de la base de datos.**

```bash
node scripts/clean-invalid-exercises.js
```

**Acciones:**
- Elimina ejercicios sin nombre válido (si no tienen referencias)
- Arregla ejercicios sin categoría
- Elimina duplicados por nombre (mantiene el mejor)
- Transfiere datos útiles antes de eliminar

### 3. `validate-and-clean-exercises.js`
**Valida URLs y limpia datos inválidos.**

```bash
node scripts/validate-and-clean-exercises.js
```

**Acciones:**
- Valida todas las URLs de imágenes y videos
- Elimina URLs inválidas
- Intenta obtener media desde wger para ejercicios sin imágenes/videos
- Actualiza ejercicios con URLs rotas

⚠️ **Nota:** Este script puede tardar mucho tiempo ya que valida cada URL individualmente.

### 4. `sync-wger-exercises.js`
**Sincroniza ejercicios desde wger API.**

```bash
node scripts/sync-wger-exercises.js
```

**Acciones:**
- Obtiene todas las imágenes disponibles (289+ imágenes)
- Obtiene todos los videos disponibles (78+ videos)
- Sincroniza ejercicios con nombres reales en español
- Almacena imágenes y videos en la base de datos
- Actualiza ejercicios existentes con media faltante

**Mejoras implementadas:**
- ✅ Obtención eficiente de todas las imágenes de una vez
- ✅ Obtención de todos los videos de una vez
- ✅ Nombres reales en español desde `/exerciseinfo/`
- ✅ Categorías correctamente mapeadas
- ✅ Videos almacenados en el campo `video_url`

### 5. `sync-and-validate-exercises.js` ⭐ **RECOMENDADO**
**Script maestro que ejecuta todo el proceso completo.**

```bash
node scripts/sync-and-validate-exercises.js
```

**Ejecuta en orden:**
1. Revisión del estado actual
2. Limpieza de ejercicios inválidos
3. Sincronización desde wger API
4. Validación de URLs
5. Revisión final del estado

## 🚀 Uso Recomendado

### Primera vez (sincronización completa):

```bash
# 1. Revisar estado actual
node scripts/check-exercises-db.js

# 2. Limpiar ejercicios inválidos
node scripts/clean-invalid-exercises.js

# 3. Sincronizar desde wger (esto puede tardar varios minutos)
node scripts/sync-wger-exercises.js

# 4. Validar URLs (opcional, puede tardar mucho)
node scripts/validate-and-clean-exercises.js

# O usar el script maestro que hace todo:
node scripts/sync-and-validate-exercises.js
```

### Mantenimiento regular:

```bash
# Revisar estado periódicamente
node scripts/check-exercises-db.js

# Si hay muchos ejercicios sin media, re-sincronizar
node scripts/sync-wger-exercises.js

# Limpiar duplicados si es necesario
node scripts/clean-invalid-exercises.js
```

## 📊 Estructura de la Tabla `exercises`

```sql
- exercise_id (PK, serial)
- name (varchar 100, unique, not null)
- category (varchar 50, not null)
- default_calories_per_minute (numeric, default 5)
- gif_url (varchar 500, nullable) -- URL de la imagen/GIF
- video_url (varchar 500, nullable) -- URL del video
- wger_id (integer, nullable) -- ID en wger API
- is_public (boolean, default true)
- created_at (timestamp)
```

## ⚡ Optimizaciones Implementadas

1. **Búsqueda local primero:** El endpoint `/api/exercises/search` busca primero en la BD local
2. **Media almacenada:** Las imágenes y videos se almacenan en `gif_url` y `video_url`
3. **Sin consultas repetidas:** Si el ejercicio tiene media almacenada, no se consulta wger
4. **Fallback inteligente:** Si falta media, se busca en wger y se almacena para próximas veces

## 🔧 Solución de Problemas

### Ejercicios sin imágenes/videos

```bash
# Re-sincronizar para obtener media faltante
node scripts/sync-wger-exercises.js
```

### URLs rotas o inválidas

```bash
# Validar y limpiar URLs
node scripts/validate-and-clean-exercises.js
```

### Ejercicios duplicados

```bash
# Limpiar duplicados
node scripts/clean-invalid-exercises.js
```

## 📈 Resultados Esperados

Después de la sincronización completa:
- ✅ 200-300+ ejercicios en la base de datos
- ✅ 289+ ejercicios con imágenes
- ✅ 78+ ejercicios con videos
- ✅ Búsquedas rápidas (sin consultas a wger)
- ✅ Sin ejercicios duplicados
- ✅ Todos los ejercicios con nombres válidos

## 💡 Notas Importantes

1. **Tiempo de ejecución:** La sincronización completa puede tardar 10-30 minutos dependiendo de la conexión
2. **Límites de wger API:** Los scripts incluyen delays para respetar los límites de la API
3. **Backup recomendado:** Hacer backup de la base de datos antes de ejecutar scripts de limpieza
4. **Validación de URLs:** La validación de URLs puede tardar mucho (5-10 segundos por URL)

## 🎯 Próximos Pasos

Después de ejecutar los scripts:
1. Los ejercicios estarán almacenados localmente
2. Las búsquedas serán más rápidas
3. No será necesario consultar wger en cada búsqueda
4. Las imágenes y videos estarán disponibles inmediatamente

