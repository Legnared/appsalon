# ==============================================================================
# Stage 1: Builder (PHP 8.3 + Composer + Node 20 para Wayfinder + Vite/SASS)
# ==============================================================================
FROM php:8.3-cli-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    curl \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl zip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Dependencias PHP
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Dependencias JS
COPY package.json package-lock.json ./
RUN npm ci

# Código fuente y compilación de Wayfinder + Vite
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views bootstrap/cache \
    && APP_ENV=production APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= npm run build

# ==============================================================================
# Stage 2: Runtime (PHP 8.3 + Apache optimizado para Railway)
# ==============================================================================
FROM php:8.3-apache-bookworm AS runtime

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl zip opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Configuración Apache para Laravel y puerto dinámico de Railway
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf

# Copiar aplicación + vendor + assets compilados desde builder
COPY --from=builder /app /var/www/html
RUN rm -rf /var/www/html/node_modules

# Normalizar saltos de línea del entrypoint (seguro si el repo se edita en Windows)
RUN sed -i 's/\r$//' /var/www/html/docker/entrypoint.sh \
    && chmod +x /var/www/html/docker/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/var/www/html/docker/entrypoint.sh"]
