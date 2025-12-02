# Sincronización de Ejercicios desde wger

Este documento explica cómo sincronizar todos los ejercicios disponibles en la API de wger a tu base de datos local.

## ¿Qué hace el script?

El script `sync-wger-exercises.js` realiza las siguientes acciones:

1. **Conecta con la API de wger** y obtiene todos los ejercicios disponibles en español
2. **Obtiene información completa** de cada ejercicio, incluyendo:
   - Nombre del ejercicio (en español)
   - Descripción
   - Categoría (mapeada a categorías locales)
   - Imagen/GIF del ejercicio
   - ID de wger para referencia futura
3. **Sincroniza con la base de datos local**:
   - Si el ejercicio ya existe, actualiza su imagen si no tiene una
   - Si el ejercicio es nuevo, lo agrega con toda su información
   - Guarda el `wger_id` para futuras referencias

## Cómo ejecutar

### Opción 1: Usando npm script (recomendado)

```bash
cd fitness-app-backend
npm run sync:wger
```

### Opción 2: Ejecutar directamente

```bash
cd fitness-app-backend
node scripts/sync-wger-exercises.js
```

## Tiempo estimado

- **Primera ejecución**: ~30-60 minutos (dependiendo de la velocidad de conexión)
  - Procesa ~736 ejercicios
  - Obtiene imágenes para cada uno
  - Realiza pausas entre peticiones para no sobrecargar la API

- **Ejecuciones posteriores**: ~10-20 minutos
  - Solo actualiza ejercicios existentes o agrega nuevos
  - Omite ejercicios que ya tienen imágenes

## Qué esperar

El script mostrará progreso en tiempo real:

```
🔄 Iniciando sincronización de ejercicios de wger...

📄 Procesando página 1...
   Encontrados 100 ejercicios en esta página
   ✅ Nuevo: Abdominales (con imagen)
   ✅ Nuevo: Press de banca
   ✏️  Actualizado: Push Up
   ⚠️  Omitido: Squat
   Progreso: 45 nuevos, 10 actualizados, 45 omitidos, 0 errores
```

Al finalizar, verás un resumen:

```
✅ Sincronización completada!
📊 Resumen:
   - Nuevos ejercicios: 650
   - Ejercicios actualizados: 50
   - Ejercicios omitidos: 36
   - Errores: 0
   - Total procesado: 736
```

## Notas importantes

1. **La primera vez puede tardar**: El script procesa todos los ejercicios de wger, lo cual puede tomar tiempo.

2. **No requiere autenticación**: La API de wger es pública, no necesitas ninguna clave API.

3. **Imágenes opcionales**: Algunos ejercicios pueden no tener imágenes disponibles en wger.

4. **Puedes ejecutarlo múltiples veces**: El script es idempotente, puedes ejecutarlo cuando quieras para mantener actualizada tu base de datos.

5. **Respetuoso con la API**: El script incluye pausas entre peticiones para no sobrecargar los servidores de wger.

## Solución de problemas

### Error de conexión
Si ves errores de conexión, verifica tu conexión a internet. El script requiere acceso a `https://wger.de`.

### Ejercicios sin nombre
Algunos ejercicios pueden no tener traducción al español disponible. Estos se omitirán automáticamente.

### Timeout
Si el script se detiene, simplemente vuelve a ejecutarlo. Continuará desde donde quedó.

## Después de sincronizar

Una vez completada la sincronización:

1. **Todos los ejercicios de wger estarán disponibles** en tu aplicación
2. **Las imágenes se mostrarán automáticamente** cuando los usuarios vean los ejercicios
3. **El autocompletado funcionará mejor** con más opciones disponibles
4. **No necesitarás buscar en wger en tiempo real** ya que todo está en tu base de datos

