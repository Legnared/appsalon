<?php

namespace App\Services\Payments\DTOs;

class PaymentResultData
{
    public function __construct(
        public readonly bool $aprobado,
        public readonly string $estado,
        public readonly string $gateway,
        public readonly ?string $referenciaBancaria = null,
        public readonly ?string $codigoAutorizacion = null,
        public readonly ?string $ultimos4 = null,
        public readonly ?string $marcaTarjeta = null,
        public readonly ?string $terminalId = null,
        public readonly ?string $mensaje = null,
        public readonly array $payload = [],
    ) {}
}
