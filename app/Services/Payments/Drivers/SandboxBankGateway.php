<?php

namespace App\Services\Payments\Drivers;

use App\Models\Cita;
use App\Models\Pago;
use App\Services\Payments\Contracts\PaymentGatewayInterface;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\PaymentResultData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;

class SandboxBankGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly array $config = [],
    ) {}

    public function driverName(): string
    {
        return 'sandbox';
    }

    public function chargeCard(Cita $cita, CardPaymentRequestData $cardData): PaymentResultData
    {
        $digitos = preg_replace('/\D+/', '', $cardData->numeroTarjeta) ?? '';
        $ultimos4 = $cardData->ultimos4();
        $marca = $cardData->detectarMarca();

        if (strlen($digitos) < 15 || strlen($digitos) > 19) {
            return new PaymentResultData(
                aprobado: false,
                estado: 'fallido',
                gateway: $this->driverName(),
                ultimos4: $ultimos4,
                marcaTarjeta: $marca,
                mensaje: 'Número de tarjeta inválido',
                payload: ['reason' => 'invalid_card_length'],
            );
        }

        // Tarjeta de prueba terminada en 0002 simula rechazo bancario
        if ($ultimos4 === '0002') {
            return new PaymentResultData(
                aprobado: false,
                estado: 'fallido',
                gateway: $this->driverName(),
                referenciaBancaria: 'REJ-' . strtoupper(uniqid()),
                ultimos4: $ultimos4,
                marcaTarjeta: $marca,
                mensaje: 'Tarjeta declinada por el banco emisor (fondos insuficientes)',
                payload: ['code' => '05', 'status' => 'declined'],
            );
        }

        $codigoAuth = (string) random_int(100000, 999999);
        $referencia = 'BNK-' . strtoupper(substr(uniqid(), -8));

        return new PaymentResultData(
            aprobado: true,
            estado: 'pagado',
            gateway: $this->driverName(),
            referenciaBancaria: $referencia,
            codigoAutorizacion: $codigoAuth,
            ultimos4: $ultimos4,
            marcaTarjeta: $marca,
            mensaje: 'Pago aprobado por banco (Sandbox)',
            payload: [
                'cita_id' => $cita->id,
                'titular' => $cardData->titular,
                'status' => 'approved',
                'sandbox' => true,
            ],
        );
    }

    public function initiateTerminalPayment(Cita $cita, TerminalPaymentRequestData $terminalData): PaymentResultData
    {
        $terminalId = $terminalData->terminalId ?: ($this->config['terminal_id'] ?? 'POS-BARBER-01');
        $referencia = 'POS-' . strtoupper(substr(uniqid(), -8));

        return new PaymentResultData(
            aprobado: true,
            estado: 'pendiente',
            gateway: $this->driverName(),
            referenciaBancaria: $referencia,
            terminalId: $terminalId,
            mensaje: 'Orden de cobro registrada para Terminal POS en barbería',
            payload: [
                'cita_id' => $cita->id,
                'modo' => $terminalData->modo,
                'terminal_id' => $terminalId,
                'status' => 'pending_pos',
            ],
        );
    }

    public function confirmTerminalPayment(Pago $pago, array $posPayload = []): PaymentResultData
    {
        $codigoAuth = trim((string) ($posPayload['codigo_autorizacion'] ?? ''));
        if ($codigoAuth === '') {
            $codigoAuth = (string) random_int(100000, 999999);
        }

        $ultimos4 = preg_replace('/\D+/', '', (string) ($posPayload['ultimos_4'] ?? '')) ?? '';
        $ultimos4 = $ultimos4 !== '' ? substr($ultimos4, -4) : null;
        $marca = strtoupper(trim((string) ($posPayload['marca_tarjeta'] ?? 'TARJETA')));
        $terminalId = trim((string) ($posPayload['terminal_id'] ?? ($pago->terminal_id ?: ($this->config['terminal_id'] ?? 'POS-BARBER-01'))));
        $referencia = $pago->referencia_bancaria ?: ('POS-' . strtoupper(substr(uniqid(), -8)));

        return new PaymentResultData(
            aprobado: true,
            estado: 'pagado',
            gateway: $this->driverName(),
            referenciaBancaria: $referencia,
            codigoAutorizacion: $codigoAuth,
            ultimos4: $ultimos4,
            marcaTarjeta: $marca !== '' ? $marca : 'TARJETA',
            terminalId: $terminalId,
            mensaje: 'Cobro confirmado en Terminal POS',
            payload: [
                'status' => 'approved_pos',
                'confirmed_via' => $posPayload['origen'] ?? 'admin_pos',
                'terminal_id' => $terminalId,
            ],
        );
    }
}
