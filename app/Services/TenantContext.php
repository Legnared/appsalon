<?php

namespace App\Services;

use App\Models\Tenant;

class TenantContext
{
    private ?Tenant $tenant = null;

    public function set(?Tenant $tenant): void
    {
        $this->tenant = $tenant;
    }

    public function current(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    public function clear(): void
    {
        $this->tenant = null;
    }

    public function brandName(): string
    {
        return $this->tenant?->nombre ?: (string) config('app.name', "Danny's BarberShop");
    }

    /**
     * Genera la ruta de almacenamiento aislada por tenant dentro del disco público.
     */
    public function storagePath(string $folder): string
    {
        $cleanFolder = trim($folder, '/');

        if ($this->tenant) {
            return "tenants/{$this->tenant->id}/{$cleanFolder}";
        }

        return $cleanFolder;
    }

    /**
     * Devuelve la configuración efectiva de pagos para el tenant activo,
     * con fallback seguro a config/payments.php.
     */
    public function paymentConfig(): array
    {
        $tenant = $this->tenant;

        return [
            'driver' => $tenant?->payment_driver ?: (string) config('payments.default', 'sandbox'),
            'currency' => $tenant?->moneda ?: (string) config('payments.currency', 'MXN'),
            'anticipo_tipo' => $tenant?->anticipo_tipo ?: (string) config('payments.anticipo.tipo', 'fijo'),
            'anticipo_valor' => $tenant?->anticipo_valor !== null
                ? (float) $tenant->anticipo_valor
                : (float) config('payments.anticipo.valor', 100),
            'spei' => [
                'banco' => $tenant?->spei_banco ?: (string) config('payments.spei.banco', 'Mercado Pago / STP'),
                'titular' => $tenant?->spei_titular ?: (string) config('payments.spei.titular', 'Barber Dani'),
                'clabe' => $tenant?->spei_clabe ?: (string) config('payments.spei.clabe', ''),
            ],
            'whatsapp_negocio' => $tenant?->whatsapp_negocio ?: (string) config('payments.whatsapp_negocio', ''),
            'mercadopago' => [
                'access_token' => $tenant?->mercadopago_access_token ?: (string) config('payments.drivers.mercadopago.access_token', ''),
                'public_key' => $tenant?->mercadopago_public_key ?: (string) config('payments.drivers.mercadopago.public_key', ''),
                'point_device_id' => $tenant?->mercadopago_point_device_id ?: (string) config('payments.drivers.mercadopago.point_device_id', ''),
                'notification_url' => $tenant?->mercadopago_webhook_url ?: (string) config('payments.drivers.mercadopago.notification_url', ''),
            ],
        ];
    }

    /**
     * Representación segura del tenant actual para compartir vía Inertia.
     */
    public function frontendPayload(): array
    {
        if ($this->tenant) {
            return $this->tenant->toFrontendArray();
        }

        return [
            'id' => null,
            'nombre' => (string) config('app.name', "Danny's BarberShop"),
            'slug' => 'dannys',
            'tagline' => 'Estilo & Precisión',
            'logo_url' => '/img/icono.png',
            'hero_url' => '/img/1.webp',
            'color_primario' => '#d4a259',
            'tema_diseno' => 'rustico_editorial',
            'whatsapp_negocio' => (string) config('payments.whatsapp_negocio', ''),
            'plan' => 'anual',
        ];
    }
}
