<?php

use App\Services\Payments\Drivers\GenericRestBankGateway;
use App\Services\Payments\Drivers\SandboxBankGateway;

return [
    /*
    |--------------------------------------------------------------------------
    | Driver Bancario Activo (Multi-Gateway)
    |--------------------------------------------------------------------------
    | Soporta 'sandbox' para pruebas locales sin cargo real, o 'bank_api'
    | para conectar cualquier API REST bancaria (BBVA, Banorte, Santander,
    | Openpay, Stripe, MercadoPago, Clip, etc.) u otros drivers propios.
    */
    'default' => env('PAYMENT_GATEWAY_DRIVER', 'sandbox'),

    'currency' => env('PAYMENT_CURRENCY', 'MXN'),

    'drivers' => [
        'sandbox' => [
            'driver' => SandboxBankGateway::class,
            'terminal_id' => env('BANK_POS_TERMINAL_ID', 'POS-BARBER-01'),
        ],

        'bank_api' => [
            'driver' => GenericRestBankGateway::class,
            'base_url' => env('BANK_API_BASE_URL', ''),
            'public_key' => env('BANK_API_PUBLIC_KEY', ''),
            'secret_key' => env('BANK_API_SECRET_KEY', ''),
            'merchant_id' => env('BANK_API_MERCHANT_ID', ''),
            'terminal_id' => env('BANK_POS_TERMINAL_ID', 'POS-BARBER-01'),
            'webhook_secret' => env('BANK_WEBHOOK_SECRET', ''),
            'timeout' => (int) env('BANK_API_TIMEOUT', 15),
        ],
    ],
];
