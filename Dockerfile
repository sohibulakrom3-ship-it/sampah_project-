# --- Stage 1: Build Frontend Assets ---
FROM node:22-alpine AS frontend-builder
ENV NODE_OPTIONS=--max-old-space-size=2048
WORKDIR /app
RUN npm config set registry https://registry.npmjs.org/
COPY package*.json ./
RUN rm -f package-lock.json && npm install --no-audit --no-fund --legacy-peer-deps
COPY . .
RUN npm run build

# --- Stage 2: Build PHP Application ---
FROM php:8.2-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    libzip-dev \
    unzip \
    git \
    oniguruma-dev \
    postgresql-dev \
    openssl

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring zip gd opcache

# Raise upload limits so foto bukti (phone photos) can be stored
RUN printf 'upload_max_filesize=20M\npost_max_size=24M\nmax_execution_time=120\n' > /usr/local/etc/php/conf.d/uploads.ini

# Generate self-signed SSL certificate for HTTPS (required for camera access)
RUN mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
       -keyout /etc/nginx/ssl/server.key \
       -out /etc/nginx/ssl/server.crt \
       -subj "/C=ID/ST=JawaBarat/L=Cileungsi/O=SiPeSa/CN=129.226.83.33"

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /app/public/build ./public/build

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Install Composer dependencies
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy Nginx and Supervisor configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /tmp/nginx_client_body && chmod 777 /tmp/nginx_client_body
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["entrypoint.sh"]
