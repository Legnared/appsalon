<?php

namespace App\Services\Payments\Drivers;

use App\Models\Cita;
use App\Models\Pago;
use App\Services\Payments\Contracts\PaymentGatewayInterface;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\PaymentResultData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;
use Illuminate\Support\Facades\Http;

class GenericRestBankGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly array $config = [],
    ) {}

    public function driverName(): string
    {
        return 'bank_api';
    }

    public function chargeCard(Cita $cita, CardPaymentRequestData $cardData): PaymentResultData
    {
        $baseUrl = rtrim((string) ($this->config['base_url'] ?? ''), '/');

        if ($baseUrl === '') {
            return new PaymentResultData(
                aprobado: false,
                estado: 'fallido',
                gateway: $this->driverName(),
                ultimos4: $cardData->ultimos4(),
                marcaTarjeta: $cardData->detectarMarca(),
                mensaje: 'Configura BANK_API_BASE_URL en .env para operar con el banco real',
            );
        }

        $response = Http::withToken((string) ($this->config['secret_key'] ?? ''))
            ->timeout((int) ($this->config['timeout'] ?? 15))
            ->acceptJson()
            ->post("{$baseUrl}/charges/card", [
                'merchant_id' => $this->config['merchant_id'] ?? null,
                'order_id' => 'CITA-' . $cita->id,
                'amount' => $cardData->monto,
                'currency' => $cardData->moneda,
                'card_holder' => $cardData->titular,
                'card_number' => preg_replace('/\D+/', '', $cardData->numeroTarjeta),
                'expiration' => $cardData->expiracion,
                'cvv' => $cardData->cvv,
                'customer_email' => $cardData->emailCliente,
            ]);

        $json = $response->json() ?? [];
        $aprobado = $response->successful() && (($json['approved'] ?? false) || ($json['status'] ?? '') === 'approved');

        return new PaymentResultData(
            aprobado: $aprobado,
            estado: $aprobado ? 'pagado' : 'fallido',
            gateway: $this->driverName(),
            referenciaBancaria: $json['transaction_id'] ?? $json['id'] ?? null,
            codigoAutorizacion: $json['authorization_code'] ?? null,
            ultimos4: $cardData->ultimos4(),
            marcaTarjeta: $json['card_brand'] ?? $cardData->detectarMarca(),
            mensaje: $json['message'] ?? ($aprobado ? 'Pago aprobado por banco' : 'Pago rechazado por el banco'),
            payload: $json,
        );
    }

    public function initiateTerminalPayment(Cita $cita, TerminalPaymentRequestData $terminalData): PaymentResultData
    {
        $baseUrl = rtrim((string) ($this->config['base_url'] ?? ''), '/');
        $terminalId = $terminalData->terminalId ?: ($this->config['terminal_id'] ?? 'POS-BARBER-01');

        if ($baseUrl === '' || $terminalData->modo === 'en_sucursal') {
            return new PaymentResultData(
                aprobado: true,
                estado: 'pendiente',
                gateway: $this->driverName(),
                referenciaBancaria: 'POS-' . strtoupper(substr(uniqid(), -8)),
                terminalId: $terminalId,
                mensaje: 'Cita reservada con pago pendiente en Terminal POS',
                payload: ['modo' => $terminalData->modo, 'terminal_id' => $terminalId],
            );
        }

        $response = Http::withToken((string) ($this->config['secret_key'] ?? ''))
            ->timeout((int) ($this->config['timeout'] ?? 15))
            ->acceptJson()
            ->post("{$baseUrl}/pos/intents", [
                'merchant_id' => $this->config['merchant_id'] ?? null,
                'terminal_id' => $terminalId,
                'order_id' => 'CITA-' . $cita->id,
                'amount' => $terminalData->monto,
                'currency' => $terminalData->moneda,
            ]);

        $json = $response->json() ?? [];

        return new PaymentResultData(
            aprobado: $response->successful(),
            estado: $response->successful() ? 'procesando' : 'pendiente',
            gateway: $this->driverName(),
            referenciaBancaria: $json['intent_id'] ?? $json['id'] ?? ('POS-' . strtoupper(substr(uniqid(), -8))),
            terminalId: $terminalId,
            mensaje: $json['message'] ?? 'Solicitud enviada a Terminal POS',
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
            referenciaBancaria: $pago->referencia_bancaria ?: ($posPayload['referencia_bancaria'] ?? 'POS-' . strtoupper(substr(uniqid(), -8))),
            codigoAutorizacion: $codigoAuth !== '' ? $codigoAuth : null,
            ultimos4: isset($posPayload['ultimos_4']) ? substr(preg_replace('/\D+/', '', (string) $posPayload['ultimos_4']), -4) : null,
            marcaTarjeta: strtoupper((string) ($posPayload['marca_tarjeta'] ?? 'TARJETA')),
            terminalId: $posPayload['terminal_id'] ?? $pago->terminal_id,
            mensaje: 'Pago en Terminal POS confirmado',
            payload: $posPayload,
        );
    }
}
