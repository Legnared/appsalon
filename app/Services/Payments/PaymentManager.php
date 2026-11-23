<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGatewayInterface;
use App\Services\Payments\Drivers\SandboxBankGateway;
use InvalidArgumentException;

class PaymentManager
{
    public function driver(?string $name = null): PaymentGatewayInterface
    {
        $driverName = $name ?: (string) config('payments.default', 'sandbox');
        $driverConfig = config("payments.drivers.{$driverName}");

        if (! is_array($driverConfig) || empty($driverConfig['driver'])) {
            if ($driverName === 'sandbox') {
                return new SandboxBankGateway();
            }
            throw new InvalidArgumentException("Driver de pago no configurado: {$driverName}");
        }

        $class = $driverConfig['driver'];

        return new $class($driverConfig);
    }
}
