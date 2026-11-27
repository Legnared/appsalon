# Spec 022: Ausencias, Vacaciones y Días Libres por Barbero (Multi-Tenant)

## 1. Objetivo
Permitir que cualquier dueño o barbero (ej. Dani, Diego o cualquier integrante de cualquier barbería del SaaS) registre días en los que no laborará (compromisos personales, vacaciones, capacitaciones) sin cerrar la barbería completa ni desactivar al barbero permanentemente, avisando a los clientes con antelación al iniciar sesión y bloqueando automáticamente las citas con ese barbero en las fechas bloqueadas.

## 2. Alcance
- **Tabla `barbero_ausencias`** (`tenant_id`, `barbero_id`, `fecha_inicio`, `fecha_fin`, `motivo`, `visible_clientes`, `timestamps`).
- **Modelo `BarberoAusencia`** con `BelongsToTenant`, scopes `enFecha($fecha)` y `proximas()`.
- **Gestión en `/horarios` (`HorarioController`):** registrar nuevas ausencias por barbero y eliminar ausencias si cambian los planes, auditado en `BitacoraService`.
- **Portal del Cliente (`/cita`, `/api/disponibilidad`, `POST /api/citas`):**
  - Banner de aviso anticipado al iniciar sesión listando ausencias vigentes/próximas (`visible_clientes = true`).
  - Bloqueo automático en `/api/disponibilidad` (`barbero_ausente: true`, `slots: []`) y sugerencia de cambiar a otro barbero disponible ese día.
  - Validación estricta en `POST /api/citas` (`422`) impidiendo agendar con un barbero ausente en esa fecha.
