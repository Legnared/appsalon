# Plan Técnico 006: Motor de Pagos Multi-Banco (Tarjeta + Terminal POS)

## 1. Archivos a Crear / Modificar

```text
config/
└── payments.php                              # Configuración de drivers bancarios y terminales POS
database/
└── migrations/
    └── 0001_01_01_000005_create_pagos_table.php
app/
├── Models/
│   └── Pago.php                              # Modelo Eloquent para la tabla `pagos`
├── Services/
│   └── Payments/
│       ├── Contracts/
│       │   └── PaymentGatewayInterface.php
│       ├── DTOs/
│       │   ├── CardPaymentRequestData.php
│       │   ├── TerminalPaymentRequestData.php
│       │   └── PaymentResultData.php
│       ├── Drivers/
│       │   ├── SandboxBankGateway.php
│       │   └── GenericRestBankGateway.php
│       └── PaymentManager.php
└── Http/
    └── Controllers/
        ├── PagoController.php
        └── PagoWebhookController.php
resources/
├── scss/
│   └── layout/
│       └── _pagos.scss                       # Estilos SASS del módulo de tarjeta y terminal POS
└── js/
    └── Components/
        └── MetodoPagoSelector.jsx            # Componente React de tarjeta y terminal para Paso 3
```

## 2. Configuración Multi-Banco (`config/payments.php`)

```php
return [
    'default' => env('PAYMENT_GATEWAY_DRIVER', 'sandbox'),

    'drivers' => [
        'sandbox' => [
            'driver' => \App\Services\Payments\Drivers\SandboxBankGateway::class,
            'terminal_timeout' => 5,
        ],
        'bank_api' => [
            'driver' => \App\Services\Payments\Drivers\GenericRestBankGateway::class,
            'base_url' => env('BANK_API_BASE_URL'),
            'public_key' => env('BANK_API_PUBLIC_KEY'),
            'secret_key' => env('BANK_API_SECRET_KEY'),
            'merchant_id' => env('BANK_API_MERCHANT_ID'),
            'terminal_id' => env('BANK_POS_TERMINAL_ID'),
            'webhook_secret' => env('BANK_WEBHOOK_SECRET'),
        ],
    ],
];
```

## 3. Reglas de Simulación en `SandboxBankGateway` (Para Pruebas Sin Cargo Real)
- Cualquier tarjeta válida de 16 dígitos (Luhn o formato estándar) se **aprueba** devolviendo `estado = 'pagado'`, `codigo_autorizacion` aleatorio de 6 dígitos y `referencia_bancaria = 'BNK-' . strtoupper(uniqid())`.
- Tarjetas terminadas en `0002` simulan **fondos insuficientes / tarjeta declinada** (`estado = 'fallido'`, mensaje `"Tarjeta declinada por el banco emisor"`).
- En modo **Terminal POS**, permite simular tanto el envío directo a terminal física como la confirmación desde el panel `/admin`.
