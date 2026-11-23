<?php

namespace App\Services\Payments\DTOs;

class CardPaymentRequestData
{
    public function __construct(
        public readonly float $monto,
        public readonly string $moneda,
        public readonly string $titular,
        public readonly string $numeroTarjeta,
        public readonly string $expiracion,
        public readonly string $cvv,
        public readonly ?string $emailCliente = null,
    ) {}

    public function ultimos4(): string
    {
        $soloDigitos = preg_replace('/\D+/', '', $this->numeroTarjeta) ?? '';

        return substr($soloDigitos, -4);
    }

    public function detectarMarca(): string
    {
        $digitos = preg_replace('/\D+/', '', $this->numeroTarjeta) ?? '';

        if (str_starts_with($digitos, '4')) {
            return 'VISA';
        }
        if (preg_match('/^(5[1-5]|2[2-7])/', $digitos)) {
            return 'MASTERCARD';
        }
        if (preg_match('/^3[47]/', $digitos)) {
            return 'AMEX';
        }

        return 'TARJETA';
    }
}
