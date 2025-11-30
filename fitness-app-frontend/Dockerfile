# Dockerfile para el Frontend (Multi-stage build)
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

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

