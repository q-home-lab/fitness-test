# Configuración de API Keys para GIFs de Ejercicios

Para habilitar la funcionalidad de GIFs de ejercicios, necesitas configurar las siguientes API keys opcionales:

## 1. Giphy API (Recomendado - Gratuita)

Giphy se usa como fuente principal para obtener GIFs de ejercicios.

### Pasos:

1. Visita https://developers.giphy.com/
2. Crea una cuenta gratuita
3. Ve a "Create an App" → "API"
4. Copia tu API Key
5. Agrega al archivo `.env`:

```env
GIPHY_API_KEY=tu-api-key-aqui
```

**Nota**: Si no configuras esta clave, se usará una clave demo que tiene límites de uso.

## 2. ExerciseDB API (Opcional)

ExerciseDB proporciona información detallada sobre ejercicios, pero los GIFs vienen principalmente de Giphy.

### Pasos:

1. Visita https://api-ninjas.com/
2. Crea una cuenta gratuita
3. Ve a "API Keys"
4. Copia tu API Key
5. Agrega al archivo `.env`:

```env
EXERCISE_DB_API_KEY=tu-api-key-aqui
```

## Configuración Mínima

La aplicación funcionará sin estas API keys, pero mostrará placeholders en lugar de GIFs reales. Para la mejor experiencia, se recomienda al menos configurar GIPHY_API_KEY.

## Límites de Uso

- **Giphy Free**: 42,000 requests/día
- **ExerciseDB Free**: 10 requests/minuto

Estos límites son más que suficientes para uso personal o de desarrollo.

