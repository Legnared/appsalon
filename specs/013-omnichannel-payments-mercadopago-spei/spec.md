# Spec 013: Pagos Omnicanal (Anticipo o 100%, Mercado Pago, Transferencia SPEI, Point POS y Efectivo)

## 1. Objetivo
Adaptar el motor de pagos de **AppSalon** a la operación real de una barbería en México (como **Barber Dani**), permitiendo:
1. **Flexibilidad total para el cliente en `/cita` (Paso 3):**
   - Elegir modalidad de monto: **Pagar Anticipo** (configurable, ej. `$100 MXN` o `30%`) **o** **Pagar el 100%**.
   - Elegir método de pago:
     - **`mercadopago` / `tarjeta_online`:** Pago en línea con tarjeta o **Mercado Pago Checkout Pro** (con driver real `MercadoPagoGateway` listo para credenciales de producción/sandbox).
     - **`transferencia` (SPEI):** Muestra datos bancarios configurados (Banco, Titular, CLABE y referencia `CITA-#ID`), registra el pago como `pendiente_validacion` y ofrece botón directo **"Enviar comprobante por WhatsApp"** al número del dueño/barbería.
     - **`terminal_pos` / `efectivo`:** Reserva y liquida en mostrador con **Mercado Pago Point** o **Efectivo**.
2. **Gestión de Anticipo + Saldo Pendiente + Liquidación en `/admin`:**
   - Mostrar claramente `Monto Total`, `Pagado` (anticipo o total) y `Saldo Pendiente`.
   - Botón **`Liquidar Saldo / Confirmar Pago`** permitiendo cerrar el saldo pendiente con **Terminal Point**, **Transferencia SPEI confirmada** o **Efectivo en caja**.
   - Botón **`WhatsApp`** en cada cita para enviar recordatorio o link de pago al cliente.

## 2. Evolución de Esquema (`pagos` — Migración Aditiva)
Archivo: `database/migrations/2026_01_01_000012_add_omnichannel_fields_to_pagos_table.php`
- Ampliar `metodo` a `string('metodo', 30)` para soportar `tarjeta_online`, `mercadopago`, `transferencia`, `terminal_pos`, `efectivo`.
- `tipo_cobro`: `string('tipo_cobro', 20)->default('total')` (`anticipo` | `total`).
- `monto_total`: `decimal('monto_total', 8, 2)->default(0)` (precio total de la cita).
- `monto_pagado`: `decimal('monto_pagado', 8, 2)->default(0)` (lo ya cobrado/confirmado).
- `saldo_pendiente`: `decimal('saldo_pendiente', 8, 2)->default(0)` (`monto_total - monto_pagado`).
- `metodo_liquidacion`: `string('metodo_liquidacion', 30)->nullable()` (método usado en mostrador para liquidar el saldo).
- `link_pago`: `string('link_pago', 500)->nullable()` (URL de Checkout Pro / Link de Pago de Mercado Pago).

## 3. Driver Real de Mercado Pago (`MercadoPagoGateway`) + Variables `.env`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_POINT_DEVICE_ID`
- `SPEI_BANCO`, `SPEI_TITULAR`, `SPEI_CLABE`, `WHATSAPP_NEGOCIO` (`5216312487987`)
- `ANTICIPO_TIPO` (`fijo` | `porcentaje`), `ANTICIPO_VALOR` (`100` o `30`)
