<?php

namespace App\Services\Payments\Drivers;

use App\Models\Cita;
use App\Models\Pago;
use App\Services\Payments\Contracts\PaymentGatewayInterface;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\PaymentResultData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;
use Illuminate\Support\Facades\Http;

class MercadoPagoGateway implements PaymentGatewayInterface
{
    private const API_BASE = 'https://api.mercadopago.com';

    public function __construct(
        private readonly array $config = [],
    ) {}

    public function driverName(): string
    {
        return 'mercadopago';
    }

    /**
     * Genera preferencia Checkout Pro (Link de pago web / WhatsApp) en Mercado Pago.
     */
    public function createCheckoutPreference(Cita $cita, float $monto, string $moneda, string $descripcion): array
    {
        $token = (string) ($this->config['access_token'] ?? '');
        if ($token === '') {
            return [
                'ok' => false,
                'init_point' => null,
                'id' => 'MP-DEMO-' . strtoupper(substr(uniqid(), -6)),
                'mensaje' => 'Configura MERCADOPAGO_ACCESS_TOKEN en .env para generar links reales de Checkout Pro',
            ];
        }

        $body = [
            'items' => [
                [
                    'title' => $descripcion,
                    'quantity' => 1,
                    'currency_id' => $moneda,
                    'unit_price' => round($monto, 2),
                ],
            ],
            'external_reference' => 'CITA-' . $cita->id,
            'back_urls' => [
                'success' => url('/cita?pago=aprobado'),
                'pending' => url('/cita?pago=pendiente'),
                'failure' => url('/cita?pago=rechazado'),
            ],
            'auto_return' => 'approved',
        ];

        if (! empty($this->config['notification_url'])) {
            $body['notification_url'] = $this->config['notification_url'];
        }

        $response = Http::withToken($token)
            ->timeout((int) ($this->config['timeout'] ?? 15))
            ->acceptJson()
            ->post(self::API_BASE . '/checkout/preferences', $body);

        $json = $response->json() ?? [];

        return [
            'ok' => $response->successful(),
            'id' => $json['id'] ?? null,
            'init_point' => $json['init_point'] ?? $json['sandbox_init_point'] ?? null,
            'payload' => $json,
            'mensaje' => $response->successful()
                ? 'Link de Mercado Pago generado'
                : ($json['message'] ?? 'Error al generar preferencia de Mercado Pago'),
        ];
    }

    public function chargeCard(Cita $cita, CardPaymentRequestData $cardData): PaymentResultData
    {
        $pref = $this->createCheckoutPreference(
            $cita,
            $cardData->monto,
            $cardData->moneda,
            "App Salón · Cita #{$cita->id}"
        );

        return new PaymentResultData(
            aprobado: (bool) ($pref['ok'] ?? false),
            estado: ($pref['ok'] ?? false) ? 'pendiente' : 'fallido',
            gateway: $this->driverName(),
            referenciaBancaria: $pref['id'] ?? null,
            ultimos4: $cardData->ultimos4(),
            marcaTarjeta: $cardData->detectarMarca(),
            mensaje: $pref['mensaje'] ?? 'Preferencia de Mercado Pago',
            payload: [
                'init_point' => $pref['init_point'] ?? null,
                'raw' => $pref['payload'] ?? [],
            ],
        );
    }

    public function initiateTerminalPayment(Cita $cita, TerminalPaymentRequestData $terminalData): PaymentResultData
    {
        $token = (string) ($this->config['access_token'] ?? '');
        $deviceId = $terminalData->terminalId ?: (string) ($this->config['point_device_id'] ?? '');

        if ($token === '' || $deviceId === '' || $terminalData->modo === 'en_sucursal') {
            return new PaymentResultData(
                aprobado: true,
                estado: 'pendiente',
                gateway: $this->driverName(),
                referenciaBancaria: 'MP-POS-' . strtoupper(substr(uniqid(), -8)),
                terminalId: $deviceId !== '' ? $deviceId : 'POINT-BARBER-01',
                mensaje: 'Cita reservada para liquidar en Terminal Mercado Pago Point',
                payload: ['modo' => $terminalData->modo, 'device_id' => $deviceId],
            );
        }

        // Mercado Pago Point Integrations API: enviar intención de cobro directo a la terminal Point
        $response = Http::withToken($token)
            ->timeout((int) ($this->config['timeout'] ?? 15))
            ->acceptJson()
            ->post(self::API_BASE . "/point/integration-api/devices/{$deviceId}/payment-intents", [
                'amount' => (int) round($terminalData->monto * 100),
                'description' => "App Salón Cita #{$cita->id}",
                'additional_info' => [
                    'external_reference' => 'CITA-' . $cita->id,
                    'print_on_terminal' => true,
                ],
            ]);

        $json = $response->json() ?? [];

        return new PaymentResultData(
            aprobado: $response->successful(),
            estado: $response->successful() ? 'procesando' : 'pendiente',
            gateway: $this->driverName(),
            referenciaBancaria: $json['id'] ?? ('MP-POS-' . strtoupper(substr(uniqid(), -8))),
            terminalId: $deviceId,
            mensaje: $response->successful()
                ? 'Cobro enviado a Terminal Mercado Pago Point'
                : ($json['message'] ?? 'No se pudo enviar a Point, quedará pendiente en mostrador'),
            payload: $json,
        );
    }

    public function confirmTerminalPayment(Pago $pago, array $posPayload = []): PaymentResultData
    {
        $codigoAuth = trim((string) ($posPayload['codigo_autorizacion'] ?? ''));

        return new PaymentResultData(
            aprobado: true,
            estado: 'pagado',
            gateway: $this->driverName(),
            referenciaBancaria: $pago->referencia_bancaria ?: ('MP-POS-' . strtoupper(substr(uniqid(), -8))),
            codigoAutorizacion: $codigoAuth !== '' ? $codigoAuth : (string) random_int(100000, 999999),
            ultimos4: ! empty($posPayload['ultimos_4']) ? substr(preg_replace('/\D+/', '', (string) $posPayload['ultimos_4']), -4) : null,
            marcaTarjeta: strtoupper((string) ($posPayload['marca_tarjeta'] ?? 'POINT')),
            terminalId: $posPayload['terminal_id'] ?? $pago->terminal_id,
            mensaje: 'Cobro liquidado en Mercado Pago Point',
            payload: $posPayload,
        );
    }
}
