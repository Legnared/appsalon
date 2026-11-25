# Plan 017: Modularidad por Planes y Panel Super-Admin

1. **Backend:**
   - `app/Services/FeatureManager.php`: catálogo de módulos, defaults por plan y resolución por tenant.
   - `app/Http/Middleware/EnsureFeatureEnabled.php`: middleware `feature:{clave}` registrado en `bootstrap/app.php`.
   - `app/Http/Middleware/HandleInertiaRequests.php`: compartir `features`.
   - `app/Http/Controllers/SuperAdminTenantController.php`: CRUD + onboarding transaccional + toggle de suspensión.
   - `routes/web.php`: rutas `/super-admin*` bajo `['auth', 'bitacora_admin']` y protección `feature:*` en `/barberos*` y `/clientes*`.
2. **Frontend:**
   - `resources/js/hooks/useFeature.js`
   - `resources/js/Pages/SuperAdmin/Index.jsx`
   - `resources/js/Pages/SuperAdmin/Form.jsx` (reutilizable para Crear y Editar barbería + toggles de módulos)
   - Integración en `AppSidebar.jsx` y `MobileTopBar.jsx` (enlace Super-Admin SaaS + ocultamiento por `useFeature`).
   - Estilos en `resources/scss/layout/_superadmin.scss` importado desde `_index.scss`.
3. **Validación:** `php -l` y `npm run build` (Wayfinder + Vite).
