# Spec 011: Reservas para Hijos / Familiares + Resumen de Reservaciones en Sidebar

## 1. Objetivo
Permitir que un padre de familia o titular pueda **reservar múltiples citas desde una sola cuenta** tanto para sí mismo como para sus **hijos o familiares**, y visualizar en tiempo real un **resumen de sus próximas reservaciones en el Sidebar** (y en un bloque compacto en móvil).

## 2. Evolución de Esquema (`citas` — Migración Aditiva)
Archivo: `database/migrations/2026_01_01_000009_add_beneficiario_to_citas_table.php`
- `para_quien`: `string('para_quien', 30)->default('titular')->after('barberoId')` (`titular` | `hijo` | `familiar`)
- `nombre_beneficiario`: `string('nombre_beneficiario', 80)->nullable()->after('para_quien')`

## 3. Reglas de Negocio y UX
1. **En `/cita` (Paso 2 y Paso 3):**
   - Selector `¿Para quién es esta cita?`: `Para mí` (`titular`), `Para mi hijo` (`hijo`), `Otro familiar` (`familiar`).
   - Si elige `hijo` o `familiar`, solicita `nombre_beneficiario` (obligatorio).
   - Al terminar una reserva, refresca `misReservaciones` vía `router.reload({ only: ['misReservaciones'] })` para que el padre vea al instante la cita en el Sidebar y pueda agendar otra de inmediato (ej. la de su hijo).
2. **Resumen en el Sidebar (`AppSidebar.jsx`) y Móvil (`Pages/Cita/Index.jsx`):**
   - `HandleInertiaRequests` comparte `misReservaciones` (citas del cliente con `fecha >= hoy`, ordenadas por fecha/hora, incluyendo `para_quien`, `nombre_beneficiario`, `barbero`, `servicios`, `total` y estado de `pago`).
   - En el Sidebar del cliente se muestran sus próximas reservaciones con fecha, hora, beneficiario (`Para mí` / `Hijo: Mateo`), barbero y badge de pago (`Pagado` / `Terminal POS`).
3. **En Panel Admin / Barbero (`/admin`):**
   - Cada tarjeta de cita muestra claramente si la cita es para un hijo o familiar (`Atender a: Mateo (Hijo) · Reservó: Carlos Pérez`).
