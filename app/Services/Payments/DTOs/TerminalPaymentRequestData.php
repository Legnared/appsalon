<?php

namespace App\Services\Payments\DTOs;

class TerminalPaymentRequestData
{
    public function __construct(
        public readonly float $monto,
        public readonly string $moneda,
        public readonly ?string $terminalId = null,
        public readonly string $modo = 'en_sucursal',
    ) {}
}
