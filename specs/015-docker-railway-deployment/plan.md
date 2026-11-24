# Plan 015: Docker + Railway (Proyecto Aislado)

## Fase 1 — Preparación de Laravel para Proxy HTTPS y Correo API
1. Actualizar `bootstrap/app.php` para agregar `$middleware->trustProxies(at: '*');`.
2. Actualizar `app/Providers/AppServiceProvider.php` para forzar `URL::forceScheme('https')` cuando `APP_ENV=production` o `APP_URL` inicie con `https://`.
3. Opcional (según elección del usuario): instalar `resend/resend-php` para habilitar `MAIL_MAILER=resend` sobre HTTPS 443 en Railway Hobby.
4. Actualizar `.env.example` con las variables documentadas para Railway (`APP_NAME="Danny's BarberShop"`, `RESEND_KEY`, `RUN_MIGRATIONS_ON_BOOT`, `PAYMENT_*`).

## Fase 2 — Archivos Docker y Railway IaC
1. Crear `.dockerignore` excluyendo `_legacy/`, `node_modules/`, `vendor/`, `.env`, `.git/`, `storage/logs/*`, `public/build/`.
2. Crear `docker/apache-vhost.conf` apuntando `DocumentRoot /var/www/html/public` con `AllowOverride All`.
3. Crear `docker/entrypoint.sh` que:
   - Configura el puerto `${PORT:-8080}` en Apache.
   - Inicializa el enlace simbólico `public/storage` y siembra las fotos base de `servicios/` si el volumen persistente está vacío.
   - Ejecuta `config:cache`, `route:cache` y `view:cache`.
   - Opcionalmente ejecuta `php artisan migrate --force` si `RUN_MIGRATIONS_ON_BOOT=true`.
   - Arranca `apache2-foreground`.
4. Crear `Dockerfile` multi-stage:
   - **Stage 1 (`builder`):** `php:8.3-cli` + Composer + Node 20 -> `composer install --no-dev --optimize-autoloader` + `npm ci` + `npm run build` (con Wayfinder funcionando).
   - **Stage 2 (`runtime`):** `php:8.3-apache` -> copia código, `vendor/`, `public/build/`, `docker/seed-media/servicios/` y `docker/entrypoint.sh`.
5. Crear `railway.json` configurando `"builder": "DOCKERFILE"`, `"healthcheckPath": "/up"` y política de reinicio.

## Fase 3 — Despliegue Seguro en Railway (Solo tras aprobación del usuario)
1. Verificar cuenta con `railway whoami` / MCP sin tocar ningún proyecto existente.
2. Crear un **proyecto nuevo** (`dannys-barbershop`) + servicio **MySQL** + **Volume** en `/var/www/html/storage/app/public`.
3. Cargar variables de entorno (`APP_KEY`, `APP_URL`, `DB_*` conectadas al servicio MySQL de Railway, `MAIL_MAILER=resend`, `RESEND_KEY`, `PAYMENT_WHATSAPP_NEGOCIO`, etc.).
4. Desplegar el código desde la rama actual, ejecutar migraciones y seeders iniciales (`AdminUsuarioSeeder`, `BarberDaniSeeder`, `CatalogoBarberiaSeeder`) y verificar `GET /up` + flujo completo en la URL pública `*.up.railway.app`.
