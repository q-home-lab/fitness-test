# Configuración de SMTP para Envío de Emails

Esta guía te ayudará a configurar SMTP para que la aplicación pueda enviar emails de recuperación de contraseña.

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Configuración SMTP (requerido para recuperación de contraseña)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
SMTP_FROM=tu-email@gmail.com
```

## Configuración por Proveedor

### 1. Gmail (Recomendado para desarrollo)

**Pasos:**

1. **Habilitar la verificación en 2 pasos** en tu cuenta de Google:
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Generar una Contraseña de Aplicación:**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "Fitness App" y haz clic en "Generar"
   - **Copia la contraseña de 16 caracteres** (no tu contraseña normal)

3. **Configurar en `.env`:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # La contraseña de aplicación generada (sin espacios)
SMTP_FROM=tu-email@gmail.com
```

**Importante:** Usa la **Contraseña de Aplicación** generada, NO tu contraseña regular de Gmail.

---

### 2. Outlook / Microsoft 365

**Configuración:**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
SMTP_FROM=tu-email@outlook.com
```

**Nota:** Puede requerir habilitar "Acceso de aplicaciones menos seguras" en tu cuenta de Microsoft.

---

### 3. SendGrid (Recomendado para producción)

SendGrid ofrece un plan gratuito de 100 emails/día.

**Pasos:**

1. Regístrate en https://sendgrid.com/
2. Crea una API Key:
   - Ve a Settings → API Keys
   - Crea una nueva API Key con permisos de "Mail Send"
   - Copia la clave

3. **Configurar en `.env`:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key-de-sendgrid
SMTP_FROM=noreply@tudominio.com  # Debe estar verificado en SendGrid
```

---

### 4. Mailgun (Alternativa para producción)

**Pasos:**

1. Regístrate en https://www.mailgun.com/
2. Verifica tu dominio o usa el dominio de prueba
3. Obtén tus credenciales SMTP del dashboard

**Configuración:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tudominio.com
SMTP_PASS=tu-contraseña-smtp
SMTP_FROM=noreply@tudominio.com
```

---

### 5. Zoho Mail

**Configuración:**

```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=tu-email@tudominio.com
SMTP_PASS=tu-contraseña
SMTP_FROM=tu-email@tudominio.com
```

---

## Verificación de la Configuración

Después de configurar las variables, reinicia el servidor:

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo
node index.js
```

**Nota:** El mensaje de advertencia sobre SMTP ya no aparecerá en el inicio. Solo verás un warning si intentas enviar un email y la configuración no está completa.

## Probar el Envío de Emails

Para probar que SMTP funciona correctamente:

1. Inicia el servidor
2. Desde el frontend, solicita recuperación de contraseña
3. Revisa los logs del servidor para ver si hubo errores
4. Verifica tu bandeja de entrada (y spam) para el email

## Solución de Problemas

### Error: "Invalid login"
- **Gmail:** Asegúrate de usar una Contraseña de Aplicación, no tu contraseña regular
- **Otros:** Verifica que las credenciales sean correctas

### Error: "Connection timeout"
- Verifica que el puerto sea correcto (587 para TLS, 465 para SSL)
- Si usas un firewall, asegúrate de que permita conexiones SMTP salientes

### Error: "Authentication failed"
- Revisa que `SMTP_USER` y `SMTP_PASS` estén correctos
- Para Gmail, asegúrate de tener la verificación en 2 pasos activada

### No se envían emails pero no hay errores
- Revisa la carpeta de spam
- Verifica que `SMTP_FROM` esté configurado correctamente
- Revisa los logs del servidor para mensajes de advertencia

## Seguridad

⚠️ **Importante:** 
- **NUNCA** subas tu archivo `.env` al repositorio (ya está en `.gitignore`)
- En producción, usa variables de entorno del servidor/hosting
- Para Gmail, siempre usa Contraseñas de Aplicación, nunca tu contraseña principal
- Rotá las contraseñas periódicamente

## Variables Opcionales

- `SMTP_FROM`: Email remitente (por defecto: `no-reply@fitness-app.local`)
- `FRONTEND_BASE_URL`: URL del frontend para enlaces de recuperación (por defecto: `http://localhost:5173`)

