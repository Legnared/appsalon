# Plan 014: Bitácora de Auditoría de Solo Lectura

1. **Persistencia:** Crear migración `2026_01_01_000013_create_bitacora_eventos_table.php` y modelo `App\Models\BitacoraEvento` (append-only, sin `updated_at`).
2. **Servicio Centralizado:** Crear `App\Services\BitacoraService::registrar(...)` tolerante a fallos (`try/catch`) que captura automáticamente actor autenticado, rol, IP y User-Agent.
3. **Instrumentación:** Inyectar llamadas a `BitacoraService::registrar` en `APIController`, `PagoController`, `PagoWebhookController`, `AuthController`, `ServicioController`, `BarberoController` y `HorarioController`.
4. **Ruta y Controlador:** Registrar únicamente `GET /bitacora` dentro del grupo `middleware(['auth', 'admin'])` apuntando a `BitacoraController@index`.
5. **UI React + SASS:** Crear `resources/js/Pages/Bitacora/Index.jsx`, estilos en `resources/scss/layout/_bitacora.scss` (importado en `layout/_index.scss`) y enlaces en `AppSidebar.jsx` y `MobileTopBar.jsx` solo para administradores.
