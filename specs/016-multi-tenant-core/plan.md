# Plan 016: Núcleo Multi-Tenant (Single-DB)

## Arquitectura Elegida
- **Single-DB nativo en Laravel 12** (sin `stancl/tenancy` pesado) para conservar compatibilidad total con la tabla custom `usuarios`, Laravel Wayfinder y el despliegue ligero en Railway Hobby.

## Capas de Implementación
1. **Base de Datos (`database/migrations/`):**
   - `2026_01_01_000014_create_tenants_table.php`
   - `2026_01_01_000015_add_tenant_id_to_domain_tables.php` (con backfill de Danny's BarberShop como Tenant #1 y actualización de índices únicos compuestos).
2. **Núcleo de Contexto y Modelos (`app/Services/`, `app/Models/`):**
   - `App\Models\Tenant` (casts `encrypted` para tokens de Mercado Pago, accessors `logo_url` y `hero_url`, helper `toFrontendArray()`).
   - `App\Services\TenantContext` (singleton registrado en `AppServiceProvider`).
   - `App\Models\Concerns\BelongsToTenant` (Global Scope + auto-asignación de `tenant_id` en `creating`).
   - `App\Http\Middleware\ResolveTenant` (registrado en `bootstrap/app.php` antes de `HandleInertiaRequests`).
3. **Pagos, Controladores, Storage y Correos:**
   - `PaymentManager` recibe configuración efectiva del tenant activo.
   - `CitaController`, `APIController`, `HorarioController`, `BarberoController`, `ClienteController`, `ServicioController`, `BitacoraService`.
   - `ConfirmarCuentaMail`, `ReestablecerPasswordMail` y vistas `resources/views/emails/*.blade.php`.
4. **Frontend React + Blade:**
   - `HandleInertiaRequests` comparte `tenant`.
   - `resources/views/app.blade.php`, `resources/js/app.jsx`, `MainLayout.jsx`, `AppSidebar.jsx`, `MobileTopBar.jsx`, `AppLoader.jsx`.

## Validación
- `php -l` sobre todos los archivos PHP creados/editados.
- `npm run build` (Wayfinder + Vite + SASS + React).
- Migraciones quedan listas en el repositorio sin ejecutarse automáticamente hasta autorización explícita.
