<?php

use App\Services\Payments\Drivers\GenericRestBankGateway;
use App\Services\Payments\Drivers\MercadoPagoGateway;
use App\Services\Payments\Drivers\SandboxBankGateway;

return [
    /*
    |--------------------------------------------------------------------------
    | Driver Bancario Activo (Multi-Gateway)
    |--------------------------------------------------------------------------
    | Soporta 'sandbox' (pruebas locales), 'mercadopago' (Checkout Pro + Point)
    | o 'bank_api' (REST bancario genérico).
    */
    'default' => env('PAYMENT_GATEWAY_DRIVER', 'sandbox'),

    'currency' => env('PAYMENT_CURRENCY', 'MXN'),

    // Configuración de anticipo opcional para el cliente
    'anticipo' => [
        'tipo' => env('ANTICIPO_TIPO', 'fijo'), // 'fijo' | 'porcentaje'
        'valor' => (float) env('ANTICIPO_VALOR', 100),
    ],

    // Datos bancarios para Transferencia SPEI + WhatsApp de comprobantes
    'spei' => [
        'banco' => env('SPEI_BANCO', 'Mercado Pago / STP'),
        'titular' => env('SPEI_TITULAR', 'Barber Dani'),
        'clabe' => env('SPEI_CLABE', '722969010000000000'),
    ],

    'whatsapp_negocio' => env('WHATSAPP_NEGOCIO', '5216312487987'),

    'drivers' => [
        'sandbox' => [
            'driver' => SandboxBankGateway::class,
            'terminal_id' => env('BANK_POS_TERMINAL_ID', 'POS-BARBER-01'),
        ],

        'mercadopago' => [
            'driver' => MercadoPagoGateway::class,
            'access_token' => env('MERCADOPAGO_ACCESS_TOKEN', ''),
            'public_key' => env('MERCADOPAGO_PUBLIC_KEY', ''),
            'point_device_id' => env('MERCADOPAGO_POINT_DEVICE_ID', ''),
            'notification_url' => env('MERCADOPAGO_WEBHOOK_URL', ''),
            'timeout' => (int) env('BANK_API_TIMEOUT', 15),
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
