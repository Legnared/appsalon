# Spec 009: Roles (Dueño/Admin, Barbero, Cliente), Gestión de Barberos y Cartera de Clientes

## 1. Objetivo
Transformar **AppSalon** en una plataforma multi-barbero administrada por roles sin romper la compatibilidad con el esquema original (`admin = 1`), permitiendo:
- **Fase 1 (Base de Roles + Gestión de Barberos):**
  - Incorporar columna `rol` (`admin` | `barbero` | `cliente`) y metadatos de barbero (`especialidad`, `foto`, `activo`, `barbero_id`) en `usuarios` y `barberoId` en `citas`.
  - Permitir al Dueño/Admin **ver todos los barberos**, **crear nuevos barberos**, **editar sus datos (foto, especialidad, teléfono, acceso, contraseña opcional)** y **activar/desactivar** barberos desde `/barberos`.
- **Fase 2 (Cartera de Clientes y Prospectos):**
  - Ver todos los clientes del salón filtrables por Barbero, buscar por nombre/teléfono/email, ver historial de citas y crear nuevos clientes o prospectos asignados a un barbero desde `/clientes`.
- **Fase 3 (Portal del Barbero + Selección de Barbero con Regla Anti-Empalme de 60 Minutos + Reagendado Admin):**
  - Permitir al Barbero iniciar sesión y acceder únicamente a **su propia agenda diaria** (con cobro en Terminal POS).
  - En `/cita` (Paso 2), el cliente selecciona visualmente a su **Barbero**, elige la fecha (L–S) y escoge un horario en la grilla de `10:00` a `19:00` consultando `GET /api/disponibilidad` en tiempo real: se bloquea cualquier horario a menos de **60 minutos** de otra cita del mismo barbero (validado también en backend en `APIController@guardar`).
  - Exclusivamente el **Administrador** puede **Reagendar / Cambiar Barbero** de una cita existente (`POST /api/citas/{cita}/reagendar`) desde `/admin` ante cualquier imprevisto.

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
