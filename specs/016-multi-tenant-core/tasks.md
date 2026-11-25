# Tareas 016: Núcleo Multi-Tenant (Single-DB)

- [x] **T016.1:** Crear rama `feat/spec-016-multi-tenant` desde `main` e inspeccionar modelos, pagos, validaciones, uploads y marca actual.
- [x] **T016.2:** Documentar `spec.md`, `plan.md` y `tasks.md` en `specs/016-multi-tenant-core/`.
- [x] **T016.3:** Crear migraciones `2026_01_01_000014_create_tenants_table.php` y `2026_01_01_000015_add_tenant_id_to_domain_tables.php` (con backfill de Tenant #1 e índices únicos compuestos).
- [x] **T016.4:** Crear `Tenant`, `TenantContext`, trait `BelongsToTenant` y middleware `ResolveTenant`, integrándolo en `bootstrap/app.php` y los 6 modelos de dominio.
- [x] **T016.5:** Adaptar `PaymentManager`, `CitaController`, `APIController`, `HorarioController`, `BarberoController`, `ClienteController`, `ServicioController`, `BitacoraService` y Mailables/Blade al tenant activo.
- [x] **T016.6:** Exponer `tenant` en `HandleInertiaRequests` y actualizar `app.blade.php`, `app.jsx`, `MainLayout.jsx`, `AppSidebar.jsx`, `MobileTopBar.jsx` y `AppLoader.jsx`.
- [x] **T016.7:** Validar sintaxis PHP (`php -l`) y compilación completa (`npm run build`).
