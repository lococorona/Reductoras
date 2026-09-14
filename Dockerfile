# Etapa 1: Compilación de la aplicación
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Compilar la aplicación para producción (genera la carpeta dist/)
RUN npm run build

# Etapa 2: Servidor web ligero NGINX para producción
FROM nginx:alpine

# Copiar configuración personalizada de NGINX para puerto 3000 y SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 3000 requerido por Cloud Run
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
