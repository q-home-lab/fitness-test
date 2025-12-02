# 🚀 Guía de Despliegue del Backend

## Despliegue en Render.com (Gratuito)

### Variables de Entorno Necesarias

Configura estas variables en el dashboard de Render:

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=tu-secret-key-super-segura-genera-una-aleatoria
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app  # Opcional, para CORS
```

### Build y Start Commands

- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Ejecutar Migraciones

Después del primer despliegue, ejecuta las migraciones:

**Opción 1 - Desde Render Shell:**
1. Ve a tu servicio web en Render
2. Pestaña "Shell"
3. Ejecuta: `node db/migrate.js`

**Opción 2 - Desde tu máquina local:**
1. Obtén la External Database URL de Render
2. Crea un `.env.temp` con esa URL
3. Ejecuta los scripts de migración

### Verificar Despliegue

1. Ve a la URL de tu servicio (ej: `https://fitness-app-backend.onrender.com`)
2. Deberías ver: "Servidor de Fitness App corriendo con Express y Drizzle!"
3. Prueba: `https://tu-backend.onrender.com/api/auth/register` (debe responder)

