<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGatewayInterface;
use App\Services\Payments\Drivers\SandboxBankGateway;
use App\Services\TenantContext;
use InvalidArgumentException;

class PaymentManager
{
    public function __construct(
        private readonly ?TenantContext $tenantContext = null,
    ) {}

    public function driver(?string $name = null): PaymentGatewayInterface
    {
        $context = $this->tenantContext ?? app(TenantContext::class);
        $tenantPayments = $context->paymentConfig();

        $driverName = $name ?: (string) ($tenantPayments['driver'] ?? config('payments.default', 'sandbox'));
        $driverConfig = config("payments.drivers.{$driverName}");

        if (! is_array($driverConfig) || empty($driverConfig['driver'])) {
            if ($driverName === 'sandbox') {
                return new SandboxBankGateway();
            }
            throw new InvalidArgumentException("Driver de pago no configurado: {$driverName}");
        }

        if ($driverName === 'mercadopago' && ! empty($tenantPayments['mercadopago'])) {
            $driverConfig = array_merge($driverConfig, array_filter(
                $tenantPayments['mercadopago'],
                fn ($value) => $value !== null && $value !== ''
            ));
        }

        $class = $driverConfig['driver'];

        return new $class($driverConfig);
    }
}
