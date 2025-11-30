# Dockerfile para el Backend
FROM node:18-alpine

# Instalar dependencias del sistema si es necesario
RUN apk add --no-cache bash

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
# Este Dockerfile asume que el build context es fitness-app-backend/
# Si usas Root Directory vacío en Render, asegúrate de que el Dockerfile Path sea fitness-app-backend/Dockerfile
COPY package.json ./
COPY package-lock.json* ./

# Verificar que package.json existe antes de instalar
RUN test -f package.json || (echo "ERROR: package.json not found!" && exit 1)

# Instalar dependencias
# Usar npm install en lugar de npm ci para compatibilidad si no hay package-lock.json
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Hacer ejecutable el script de entrada
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 4000

# Usar el script de entrada
ENTRYPOINT ["./docker-entrypoint.sh"]

