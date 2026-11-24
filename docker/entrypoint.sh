#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"

# Configurar puerto dinámico de Railway en Apache
sed -ri "s/^Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:\$\{PORT\}>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Asegurar estructura de directorios de storage y cache
mkdir -p \
    /var/www/html/storage/app/public/servicios \
    /var/www/html/storage/app/public/barberos \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

# Si el volumen persistente inicia vacío, sembrar las fotografías editoriales base
if [ -d /var/www/html/docker/seed-media/servicios ] && [ -z "$(ls -A /var/www/html/storage/app/public/servicios 2>/dev/null)" ]; then
    cp -a /var/www/html/docker/seed-media/servicios/. /var/www/html/storage/app/public/servicios/
fi

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Enlace simbólico public/storage -> storage/app/public
php artisan storage:link --force || true

# Caché de configuración, rutas y vistas para producción
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Migraciones opcionales controladas explícitamente por variable de entorno
if [ "${RUN_MIGRATIONS_ON_BOOT:-false}" = "true" ]; then
    php artisan migrate --force
fi

# Seeders iniciales idempotentes opcionales (Admin, Barber Dani y Catálogo base)
if [ "${RUN_SEEDERS_ON_BOOT:-false}" = "true" ]; then
    php artisan db:seed --class=AdminUsuarioSeeder --force
    php artisan db:seed --class=BarberDaniSeeder --force
    php artisan db:seed --class=CatalogoBarberiaSeeder --force
fi

# Garantizar un único MPM en Apache (prefork para mod_php)
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*

exec apache2-foreground
