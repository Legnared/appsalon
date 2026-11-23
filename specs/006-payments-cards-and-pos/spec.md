# Spec 006: Motor de Pagos Multi-Banco (Tarjeta en Línea + Terminal POS)

## 1. Objetivo
Dotar a **AppSalon** de un módulo de pagos robusto y desacoplado mediante una **Arquitectura Multi-Gateway (Driver Pattern en Laravel 12)** que permita:
1. **Al Cliente (en el Paso 3 - Resumen de `/cita`):** Elegir al reservar su cita entre:
   - **Pago con Tarjeta en Línea (Directo en Dashboard):** Capturando los datos de su tarjeta (crédito/débito) para procesarlos en tiempo real a través de la API bancaria configurada (con validación, tokenización/autorización y recibo digital inmediato).
   - **Pago con Terminal Punto de Venta (TPV / POS):** Dejar la cita registrada con modalidad `terminal` para liquidar con tarjeta en la terminal física del salón o disparar la orden de cobro hacia una terminal conectada por API.
2. **Al Administrador (en `/admin`):** Visualizar el estado de pago de cada cita (`pendiente`, `pagado`, `fallido`, `reembolsado`), el método elegido (`tarjeta_online`, `terminal_pos`), referencia bancaria/código de autorización, y un botón para **Cobrar / Confirmar Pago en Terminal POS** cuando la cita esté pendiente de pago en terminal.
3. **Al Sistema Backend:** Conectar cualquier API bancaria o proveedor de terminal (Stripe, MercadoPago, Openpay/BBVA, Conekta, Clip, Banorte, Santander, o Sandbox local de desarrollo) simplemente implementando el contrato `PaymentGatewayInterface` y cambiando la variable de entorno `PAYMENT_GATEWAY_DRIVER`.

---

## 2. Modelo de Datos (`pagos` y extensión en `citas`)

### 2.1 Nueva Tabla `pagos`
| Columna | Tipo en Migración Laravel 12 | Descripción |
| :--- | :--- | :--- |
| `id` | `$table->id()` | PK del pago |
| `citaId` | `$table->foreignId('citaId')->constrained('citas')->cascadeOnDelete()` | FK hacia `citas(id)` |
| `usuarioId` | `$table->foreignId('usuarioId')->nullable()->constrained('usuarios')->nullOnDelete()` | FK hacia `usuarios(id)` |
| `monto` | `$table->decimal('monto', 8, 2)` | Suma exacta de los servicios de la cita al momento de reservar |
| `moneda` | `$table->string('moneda', 3)->default('MXN')` | Moneda de la transacción (`MXN`) |
| `metodo` | `$table->enum('metodo', ['tarjeta_online', 'terminal_pos'])` | Canal de pago elegido |
| `gateway` | `$table->string('gateway', 40)->default('sandbox')` | Driver bancario utilizado (`sandbox`, `stripe`, `openpay`, `mercadopago`, `banorte`, etc.) |
| `estado` | `$table->enum('estado', ['pendiente', 'procesando', 'pagado', 'fallido', 'reembolsado'])->default('pendiente')` | Estado actual del pago |
| `referencia_bancaria` | `$table->string('referencia_bancaria', 100)->nullable()` | ID de transacción / cargo devuelto por la API del banco o terminal |
| `codigo_autorizacion` | `$table->string('codigo_autorizacion', 30)->nullable()` | Código de autorización bancaria (6 dígitos) |
| `ultimos_4` | `$table->string('ultimos_4', 4)->nullable()` | Últimos 4 dígitos de la tarjeta (nunca se almacena PAN completo ni CVV en BD) |
| `marca_tarjeta` | `$table->string('marca_tarjeta', 20)->nullable()` | `VISA`, `MASTERCARD`, `AMEX`, etc. |
| `terminal_id` | `$table->string('terminal_id', 50)->nullable()` | Identificador de la terminal física POS (cuando `metodo = terminal_pos`) |
| `respuesta_payload` | `$table->json('respuesta_payload')->nullable()` | Respuesta cruda (sanitizada) de la API bancaria / webhook |
| `pagado_en` | `$table->timestamp('pagado_en')->nullable()` | Fecha y hora de confirmación del cobro |
| `timestamps` | `$table->timestamps()` | `created_at` y `updated_at` para auditoría financiera |

> **Seguridad PCI-DSS:** Jamás se guarda el número completo de tarjeta ni el CVV en la base de datos ni en logs. Solo se conservan `ultimos_4`, `marca_tarjeta`, `referencia_bancaria` y `codigo_autorizacion`.

---

## 3. Arquitectura Multi-Gateway (Driver Pattern en Laravel)

```text
app/
└── Services/
    └── Payments/
        ├── Contracts/
        │   └── PaymentGatewayInterface.php
        ├── DTOs/
        │   ├── CardPaymentRequestData.php
        │   ├── TerminalPaymentRequestData.php
        │   └── PaymentResultData.php
        ├── Drivers/
        │   ├── SandboxBankGateway.php        # Simulador bancario realista (aprueba/rechaza tarjetas de prueba y simula terminal POS)
        │   ├── GenericRestBankGateway.php    # Conector HTTP configurable para APIs bancarias REST (BBVA/Banorte/Santander/Openpay/etc.)
        │   └── TerminalPosGateway.php        # Conector para terminales punto de venta (API cloud POS / confirmación de voucher)
        └── PaymentManager.php                # Resuelve el driver activo según config('payments.default')
```

### Contrato `PaymentGatewayInterface`
- `chargeCard(Cita $cita, CardPaymentRequestData $cardData): PaymentResultData`
  - Procesa un cobro directo con tarjeta desde el dashboard del cliente.
- `initiateTerminalPayment(Cita $cita, TerminalPaymentRequestData $terminalData): PaymentResultData`
  - Crea una orden de cobro para Terminal Punto de Venta (`pendiente` o enviada por API a la terminal física).
- `confirmTerminalPayment(Pago $pago, array $posPayload): PaymentResultData`
  - Confirma el cobro realizado en la terminal física (por webhook de la terminal o acción del administrador en `/admin` ingresando/recibiendo autorización).

---

## 4. Flujo de Usuario en el Frontend (React + Inertia + SASS Original)

### 4.1 En el Paso 3 (`#paso-3` - Resumen de `Pages/Cita/Index.jsx`)
Debajo del `Resumen de Cita` y antes del botón final de confirmación:
1. Muestra el total calculado: `<p class="total"><span>Total a Pagar:</span> $${total}</p>`.
2. Selector de Modalidad de Pago (usando el estilo de botones/tarjetas SASS del sistema):
   - **Opción 1: `Pagar con Tarjeta Ahora`** (`tarjeta_online`)
     - Despliega formulario con clases `.formulario` y `.campo`:
       - `Titular de la Tarjeta` (`text`)
       - `Número de Tarjeta` (`text`, formato 16 dígitos con detección automática Visa/Mastercard/Amex)
       - `Expiración (MM/AA)` y `CVV` (`3 o 4 dígitos`)
     - Botón `.boton`: **`Pagar $${total} y Reservar Cita`**.
     - Al procesar con éxito: crea la cita y el pago con estado `pagado`, y muestra `Swal.fire` con el folio de la cita y el **código de autorización bancaria**.
   - **Opción 2: `Pagar con Terminal (POS)`** (`terminal_pos`)
     - Permite elegir si desea **Enviar cobro a Terminal conectada** o **Pagar en Terminal al llegar al Salón**.
     - Botón `.boton`: **`Reservar Cita (Pago en Terminal)`**.
     - Crea la cita y el registro en `pagos` con `metodo = 'terminal_pos'` y `estado = 'pendiente'` (o `pagado` si la terminal en línea responde aprobado inmediato).

### 4.2 En el Panel de Administración (`Pages/Admin/Index.jsx`)
En cada cita listada en `<ul class="citas">`:
- Muestra el bloque de estado financiero:
  - `Método de Pago`: `Tarjeta en Línea` o `Terminal POS`.
  - `Estado de Pago`: badge/texto (`PAGADO` en `$verde`, `PENDIENTE EN TERMINAL` en `$azul`, `FALLIDO` en `$rojo`).
  - Si está `PAGADO`: muestra `Autorización: #{codigo_autorizacion}` y `Tarjeta: {marca_tarjeta} •••• {ultimos_4}`.
  - Si está `PENDIENTE` (`terminal_pos`): muestra botón `.boton` **`Cobrar en Terminal POS`**, que abre un modal SweetAlert2 para disparar el cobro a la terminal configurada o registrar los últimos 4 dígitos y folio de autorización de la terminal física.

---

## 5. Rutas y Endpoints de Pagos (Conectados con Wayfinder)

| Método | URI | Controlador | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/citas` | `APIController@guardar` | Crea la cita, sus servicios y procesa/registra el pago según `metodo_pago` (`tarjeta_online` o `terminal_pos`). |
| `POST` | `/api/pagos/{pago}/terminal` | `PagoController@cobrarEnTerminal` | (Admin/Auth) Procesa o confirma el cobro de una cita en la Terminal POS. |
| `POST` | `/api/webhooks/pagos/{gateway}` | `PagoWebhookController@handle` | Endpoint estándar para recibir confirmaciones asíncronas de cualquier banco o terminal conectada. |

---

## 6. Criterios de Aceptación
- El cliente puede reservar y pagar con tarjeta directamente en el Paso 3 de `/cita` viendo el total real de sus servicios.
- Si el banco rechaza la tarjeta (ej. tarjeta de prueba terminada en `0002` en modo Sandbox o error de API bancaria), se muestra alerta de error clara y no se marca como pagada.
- El cliente puede elegir pago con Terminal POS, y el administrador puede cobrar/confirmar dicho pago desde `/admin`.
- El diseño visual del selector de pago y formulario de tarjeta utiliza **exclusivamente las variables y componentes SASS de AppSalon** (`resources/scss/layout/_pagos.scss` integrado en `app.scss`), manteniendo una estética 100% uniforme con el resto de la aplicación.
