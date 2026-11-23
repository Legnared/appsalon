<?php

namespace App\Services\Payments\Contracts;

use App\Models\Cita;
use App\Models\Pago;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\PaymentResultData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;

interface PaymentGatewayInterface
{
    public function driverName(): string;

    public function chargeCard(Cita $cita, CardPaymentRequestData $cardData): PaymentResultData;

    public function initiateTerminalPayment(Cita $cita, TerminalPaymentRequestData $terminalData): PaymentResultData;

    public function confirmTerminalPayment(Pago $pago, array $posPayload = []): PaymentResultData;
}
