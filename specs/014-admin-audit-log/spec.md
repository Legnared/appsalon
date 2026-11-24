# Spec 014: Bitácora de Auditoría Completa (Solo Lectura para Administrador)

## 1. Propósito
Proveer al dueño/administrador de la barbería una **bitácora inmutable y de solo lectura** (`/bitacora`) que registre automáticamente todo evento relevante del sistema —especialmente estatus y movimientos de pagos, citas, acciones de barberos, cambios en catálogo/horarios y eventos de acceso— para auditar qué ocurrió, quién lo hizo y con qué datos exactos.

## 2. Requisitos Funcionales
1. **Exclusividad y Solo Lectura:**
   - Solo accesible por el **Administrador técnico del sistema** (`admin = true` y `es_barbero = false`, protegido con `middleware(['auth', 'bitacora_admin'])`).
   - El dueño/barbero-administrador (ej. Barber Dani, con `admin = true` y `es_barbero = true`) conserva acceso completo al negocio (Agenda, Clientes, Barberos, Servicios y Horarios), pero **no** ve el enlace ni tiene acceso a `/bitacora`.
   - Los barberos y clientes tampoco pueden ver ni acceder a `/bitacora`.
   - No existen acciones de edición ni eliminación de registros de bitácora (append-only).
2. **Cobertura de Eventos:**
   - **Pagos:** creación de pago (tarjeta/Mercado Pago/SPEI/Terminal Point), aprobación de anticipo o total, rechazo bancario, liquidación de saldo en sucursal (registrando qué admin o barbero cobró), y webhooks bancarios recibidos.
   - **Citas:** creación, reagendado (con valores antes/después) y eliminación.
   - **Servicios:** creación, actualización, cambio de estado activo/inactivo y eliminación.
   - **Barberos:** alta, actualización y activación/desactivación.
   - **Horarios:** cambios en días abiertos, horarios de apertura/cierre e intervalos.
   - **Autenticación:** inicio de sesión exitoso, intentos fallidos, cierre de sesión, registros, confirmaciones y recuperación de contraseña.
3. **Datos Registrados por Evento:**
   - `modulo`, `accion`, `nivel` (`info`, `exito`, `alerta`, `error`), `descripcion`, `usuario_id`, `usuario_nombre`, `usuario_rol`, `entidad_tipo`, `entidad_id`, `ip_address`, `user_agent`, `detalles` (JSON) y `created_at`.
4. **Consulta y Filtrado:**
   - Filtros por módulo, nivel, rango de fechas (`desde`/`hasta`) y búsqueda de texto libre.
   - Paginación y visor expandible de `detalles` JSON para inspeccionar folios, montos, referencias y cambios.
