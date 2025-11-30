# 📚 Guía: Poblar Base de Datos con Ejercicios de free-exercise-db

Este script pobla la base de datos con más de 800 ejercicios de la base de datos pública [free-exercise-db](https://github.com/yuhonas/free-exercise-db).

## 🎯 Características

- **800+ ejercicios**: Descarga y procesa todos los ejercicios de free-exercise-db
- **Imágenes incluidas**: Las imágenes se cargan desde GitHub raw URLs
- **Mapeo inteligente**: Convierte categorías y calcula calorías automáticamente
- **Procesamiento en lotes**: Procesa ejercicios en lotes de 50 para mejor rendimiento
- **Actualización segura**: Actualiza ejercicios existentes o inserta nuevos

## 📋 Requisitos Previos

1. Base de datos configurada y corriendo
2. Variables de entorno configuradas (`.env`)
3. Dependencias instaladas (`npm install`)

## 🚀 Uso

### Opción 1: Usando npm script (Recomendado)

```bash
cd fitness-app-backend
npm run populate:exercises
```

### Opción 2: Ejecutar directamente

```bash
cd fitness-app-backend
node scripts/populate-free-exercise-db.js
```

## 📊 Qué hace el script

1. **Descarga los ejercicios**: Obtiene el archivo `exercises.json` desde GitHub
2. **Limpia la base de datos**: Elimina todos los ejercicios públicos existentes
3. **Procesa cada ejercicio**:
   - Limpia y normaliza el nombre
   - Mapea la categoría (strength → Fuerza, cardio → Cardio, etc.)
   - Calcula calorías por minuto basado en tipo, nivel y mecánica
   - Obtiene la URL de la imagen principal desde GitHub
4. **Inserta o actualiza**: Si el ejercicio ya existe, lo actualiza; si no, lo inserta

## 🔄 Mapeo de Categorías

| free-exercise-db | Nuestra Base de Datos |
|----------------|----------------------|
| `strength` | `Fuerza` |
| `cardio` | `Cardio` |
| `stretching` | `Flexibilidad` |
| `strongman` | `Fuerza` |
| `powerlifting` | `Fuerza` |
| `olympic_weightlifting` | `Fuerza` |
| `plyometrics` | `Cardio` |

## 💪 Cálculo de Calorías

El script calcula `default_calories_per_minute` basándose en:

- **Categoría base**:
  - Cardio/Plyometrics: 12 kcal/min
  - Strength/Powerlifting: 6 kcal/min
  - Stretching: 3 kcal/min
  - Otros: 5 kcal/min

- **Multiplicadores**:
  - Nivel intermedio: ×1.2
  - Nivel experto: ×1.5
  - Mecánica compuesta: ×1.3

## 🖼️ Imágenes

Las imágenes se obtienen desde:
```
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{image_path}
```

## ⚠️ Notas Importantes

- **El script elimina todos los ejercicios públicos existentes** antes de poblar
- Si quieres mantener ejercicios existentes, comenta la sección de limpieza en el script
- El proceso puede tardar varios minutos dependiendo de la conexión a internet
- Los ejercicios duplicados se actualizan en lugar de insertarse

## 📈 Salida del Script

El script muestra:
- Progreso en tiempo real
- Estadísticas por lote
- Resumen final con:
  - Ejercicios insertados
  - Ejercicios actualizados
  - Ejercicios saltados
  - Errores (si los hay)
  - Total en base de datos

## 🐛 Solución de Problemas

### Error de conexión
- Verifica tu conexión a internet
- El script tiene un timeout de 30 segundos para descargar el JSON

### Error de base de datos
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que la base de datos esté corriendo

### Ejercicios duplicados
- Es normal que algunos ejercicios se actualicen en lugar de insertarse
- El script maneja duplicados automáticamente

## 📚 Referencias

- [free-exercise-db en GitHub](https://github.com/yuhonas/free-exercise-db)
- [Frontend de free-exercise-db](https://yuhonas.github.io/free-exercise-db/)

