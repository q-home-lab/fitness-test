# Dockerfile para el Frontend (Multi-stage build)
# Stage 1: Build
FROM node:22-alpine AS builder

# Instalar dependencias del sistema necesarias para Tailwind CSS v4 y otras dependencias nativas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
# Este Dockerfile asume que el build context es fitness-app-frontend/
# Si usas Root Directory vacío en Render, asegúrate de que el Dockerfile Path sea fitness-app-frontend/Dockerfile
COPY package.json ./
COPY package-lock.json* ./

# Verificar que package.json existe antes de instalar
RUN test -f package.json || (echo "ERROR: package.json not found!" && exit 1)

# Instalar todas las dependencias (incluyendo devDependencies para el build)
# Usar npm install en lugar de npm ci para compatibilidad si no hay package-lock.json
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación
# VITE_API_URL se pasará como build arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar los archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx para SPA
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

