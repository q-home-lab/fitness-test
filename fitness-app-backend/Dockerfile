# Dockerfile para el Backend
FROM node:18-alpine

# Instalar dependencias del sistema si es necesario
RUN apk add --no-cache bash

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Hacer ejecutable el script de entrada
RUN chmod +x ./docker-entrypoint.sh

# Exponer el puerto
EXPOSE 4000

# Usar el script de entrada
ENTRYPOINT ["./docker-entrypoint.sh"]

