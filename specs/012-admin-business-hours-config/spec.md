# Spec 012: Configuración Dinámica de Horarios Laborales por Día (Admin)

## 1. Objetivo
Permitir al **Administrador / Dueño** configurar desde el panel (`/horarios`) qué días de la semana labora la barbería (Domingo a Sábado), la **hora de apertura**, la **hora de cierre** y el **intervalo entre citas** (`30`, `45` o `60` minutos), alimentando dinámicamente tanto el calendario `<BarberDatePicker />` como la disponibilidad anti-empalme de `/cita`.

## 2. Esquema (`horarios_laborales`)
Archivo: `database/migrations/2026_01_01_000011_create_horarios_laborales_table.php`
- `id`: PK
- `dia_semana`: `unsignedTinyInteger('dia_semana')->unique()` (`0` = Domingo .. `6` = Sábado)
- `nombre_dia`: `string('nombre_dia', 20)`
- `abierto`: `boolean('abierto')->default(true)` (Domingo `false` por defecto)
- `hora_apertura`: `time('hora_apertura')->default('10:00:00')`
- `hora_cierre`: `time('hora_cierre')->default('19:00:00')`
- `intervalo_minutos`: `unsignedSmallInteger('intervalo_minutos')->default(60)`

## 3. Reglas de Negocio
- Solo el rol `admin` puede consultar y modificar `/horarios`.
- Si un día está marcado como `abierto = false`, `<BarberDatePicker />` lo deshabilita automáticamente en `/cita` y `APIController@guardar` rechaza intentos en ese día.
- `GET /api/disponibilidad` genera los bloques entre `hora_apertura` y `hora_cierre` usando el `intervalo_minutos` de ese día y bloquea empalmes dentro de esa misma ventana por barbero.
