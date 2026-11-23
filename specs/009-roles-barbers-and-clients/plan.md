# Plan Técnico 009: Roles, Barberos y Clientes

## Fase 1 (Implementación Inmediata: Roles + CRUD de Barberos)
- `database/migrations/2026_01_01_000007_add_roles_and_barbers_support.php`
- `app/Models/Usuario.php`: agregar `$fillable`, `$appends = ['foto_url']`, helpers `esAdmin()`, `esBarbero()`, `esCliente()`, scopes `barberos()`, `clientes()`, relaciones `barberoAsignado()`, `clientesAsignados()`, `citasComoBarbero()`.
- `app/Models/Cita.php`: agregar `barberoId` y relación `barbero()`.
- `app/Http/Middleware/HandleInertiaRequests.php`: compartir `rol` y `foto_url` en `auth.user`.
- `app/Http/Controllers/BarberoController.php` + rutas en `routes/web.php`.
- `resources/js/Components/BarberoFormulario.jsx`, `Pages/Barberos/Index.jsx`, `Crear.jsx`, `Actualizar.jsx`.
- Integrar pestaña **Barberos** en `Components/Barra.jsx` y `Components/BottomTabBar.jsx` conectados con **Wayfinder**.

## Fase 2 (Siguiente iteración: Cartera de Clientes y Prospectos)
- `ClienteController` (`/clientes`, `/clientes/crear`, `/clientes/actualizar`) con filtro por barbero, búsqueda en vivo y alta rápida de clientes/prospectos.

## Fase 3 (Siguiente iteración: Agenda del Barbero + Selector de Barbero en `/cita`)
- Redirección post-login para `rol === 'barbero'` hacia su agenda filtrada + selector visual de barbero en Paso 2 de `/cita`.
