# Spec 009: Roles (Dueño/Admin, Barbero, Cliente), Gestión de Barberos y Cartera de Clientes

## 1. Objetivo
Transformar **AppSalon** en una plataforma multi-barbero administrada por roles sin romper la compatibilidad con el esquema original (`admin = 1`), permitiendo:
- **Fase 1 (Base de Roles + Gestión de Barberos):**
  - Incorporar columna `rol` (`admin` | `barbero` | `cliente`) y metadatos de barbero (`especialidad`, `foto`, `activo`, `barbero_id`) en `usuarios` y `barberoId` en `citas`.
  - Permitir al Dueño/Admin **ver todos los barberos**, **crear nuevos barberos**, **editar sus datos (foto, especialidad, teléfono, acceso, contraseña opcional)** y **activar/desactivar** barberos desde `/barberos`.
- **Fase 2 (Cartera de Clientes y Prospectos):**
  - Ver todos los clientes del salón filtrables por Barbero, buscar por nombre/teléfono/email, ver historial de citas y crear nuevos clientes o prospectos asignados a un barbero desde `/clientes`.
- **Fase 3 (Portal del Barbero + Selección de Barbero en `/cita`):**
  - Permitir al Barbero iniciar sesión y acceder únicamente a **su propia agenda diaria y sus clientes asignados**.
  - Permitir al Cliente elegir con qué Barbero desea agendar su cita en `/cita`.

## 2. Evolución de Esquema (Migración Aditiva)
Archivo: `database/migrations/2026_01_01_000007_add_roles_and_barbers_support.php`

### Tabla `usuarios`
- `rol`: `enum('rol', ['admin', 'barbero', 'cliente'])->default('cliente')->after('admin')` *(al migrar, actualiza automáticamente `WHERE admin = 1` → `rol = 'admin'`)*
- `especialidad`: `string('especialidad', 120)->nullable()->after('rol')`
- `foto`: `string('foto', 255)->nullable()->after('especialidad')`
- `activo`: `boolean('activo')->default(true)->after('foto')`
- `barbero_id`: `foreignId('barbero_id')->nullable()->after('activo')->constrained('usuarios')->nullOnDelete()` *(barbero asignado o de cabecera para un cliente/prospecto)*

### Tabla `citas`
- `barberoId`: `foreignId('barberoId')->nullable()->after('usuarioId')->constrained('usuarios')->nullOnDelete()`

## 3. Rutas de Fase 1 (Barberos — Middleware `['auth', 'admin']`)

| Método | URI | Controlador | Vista / Acción |
| :--- | :--- | :--- | :--- |
| `GET` | `/barberos` | `BarberoController@index` | `Pages/Barberos/Index.jsx` (listado con foto, especialidad, estado activo, # clientes y # citas) |
| `GET` | `/barberos/crear` | `BarberoController@showCrear` | `Pages/Barberos/Crear.jsx` |
| `POST` | `/barberos/crear` | `BarberoController@crear` | Crea usuario con `rol = 'barbero'`, `confirmado = true`, sube foto en `storage/barberos` |
| `GET` | `/barberos/actualizar` | `BarberoController@showActualizar` | `Pages/Barberos/Actualizar.jsx` (`?id={id}`) |
| `POST` | `/barberos/actualizar` | `BarberoController@actualizar` | Actualiza datos, especialidad, foto y contraseña opcional |
| `POST` | `/barberos/toggle-activo` | `BarberoController@toggleActivo` | Activa/desactiva barbero con Partial Reload |
