# Spec 015: Contenedorización Docker y Despliegue Seguro en Railway (Hobby)

## 1. Propósito
Preparar **Danny's BarberShop** (Laravel 12 + Inertia.js + React + Wayfinder + Vite/SASS + MySQL) para ejecutarse en producción mediante **Docker** y desplegarse en **Railway (Plan Hobby)** dentro de un **proyecto completamente nuevo y aislado**, garantizando que ningún servicio o dominio del sitio previo del usuario en Railway resulte afectado.

## 2. Reglas de Aislamiento y Seguridad (Innegociables)
1. **Proyecto Nuevo Exclusivo:** Jamás vincular (`railway link`) ni desplegar sobre un proyecto existente. Todo el despliegue vivirá en un proyecto nuevo dedicado (`dannys-barbershop`).
2. **Sin Credenciales en Repositorio:** `.env`, llaves de Mercado Pago, claves de Resend/Brevo y contraseñas de MySQL se configuran exclusivamente en las **Variables de Entorno de Railway**, nunca en Git.
3. **Correos en Railway Hobby (Sin SMTP bloqueado):** En plan Hobby los puertos SMTP salientes (`25/465/587`) están bloqueados; el envío de correos (confirmación de cuenta y recuperación de contraseña) funcionará por **API HTTPS (puerto 443)** usando **Resend** (`MAIL_MAILER=resend`) o **Brevo API**, manteniendo Mailtrap SMTP únicamente en desarrollo local.
4. **Persistencia de Imágenes:** Las fotografías subidas de servicios y barberos (`storage/app/public`) deben sobrevivir a cada redespliegue montando un **Railway Volume** en `/var/www/html/storage/app/public`. Si el volumen inicia vacío, el `entrypoint.sh` sembrará automáticamente las 8 fotografías editoriales base del catálogo.

## 3. Requisitos Técnicos del Contenedor
- **Imagen Base:** `php:8.3-apache` con extensiones `pdo_mysql`, `mbstring`, `exif`, `pcntl`, `bcmath`, `gd`, `intl`, `zip` y `mod_rewrite` habilitado.
- **Compilación Multi-Stage con Wayfinder:** El build de Vite (`npm run build`) ejecuta `@laravel/vite-plugin-wayfinder` (`php artisan wayfinder:generate`), por lo que el stage de build debe contar con PHP 8.3 + `vendor/` + Node 20 para generar rutas tipadas y compilar `public/build/*` de forma determinista.
- **Puerto Dinámico de Railway (`$PORT`):** Apache escuchará dinámicamente en `${PORT:-8080}` leyendo la variable inyectada por Railway.
- **Proxy Inverso HTTPS:** Configurar `$middleware->trustProxies(at: '*')` en `bootstrap/app.php` y `URL::forceScheme('https')` en producción en `AppServiceProvider` para evitar errores de Mixed Content en Inertia, assets y correos.
- **Healthcheck:** Exponer `/up` (ya integrado en Laravel 12) y configurarlo en `railway.json` con `restartPolicyType: ON_FAILURE`.
- **Migraciones Controladas:** Soportar `RUN_MIGRATIONS_ON_BOOT=true|false` (por defecto `false`) para que el administrador decida cuándo correr migraciones y seeders (`AdminUsuarioSeeder`, `BarberDaniSeeder`, `CatalogoBarberiaSeeder`).
