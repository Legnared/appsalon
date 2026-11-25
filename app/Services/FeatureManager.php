<?php

namespace App\Services;

use App\Models\Tenant;

class FeatureManager
{
    /**
     * Catálogo canónico de módulos vendibles por plan.
     */
    public const CATALOG = [
        'pagos_online' => [
            'nombre' => 'Pagos en Línea y Anticipos',
            'descripcion' => 'Cobro con tarjeta / Mercado Pago Checkout Pro y anticipo configurable.',
            'categoria' => 'Pagos',
        ],
        'spei' => [
            'nombre' => 'Transferencia SPEI + WhatsApp',
            'descripcion' => 'CLABE copiable y envío directo de comprobante al WhatsApp de la barbería.',
            'categoria' => 'Pagos',
        ],
        'multi_barbero' => [
            'nombre' => 'Equipo Multi-Barbero',
            'descripcion' => 'Gestión de múltiples barberos con agendas independientes y fotos de perfil.',
            'categoria' => 'Operación',
        ],
        'citas_familiares' => [
            'nombre' => 'Citas Familiares / Hijos',
            'descripcion' => 'Permite al cliente agendar cortes para sus hijos o familiares desde su cuenta.',
            'categoria' => 'Experiencia',
        ],
        'visagismo' => [
            'nombre' => 'Recomendador por Tipo de Rostro',
            'descripcion' => 'Guía de estilos recomendados según la forma de rostro del cliente.',
            'categoria' => 'Experiencia',
        ],
        'crm_clientes' => [
            'nombre' => 'Directorio de Clientes y Prospectos',
            'descripcion' => 'Cartera CRM de clientes con barbero preferido e historial de citas.',
            'categoria' => 'Operación',
        ],
        'dominio_propio' => [
            'nombre' => 'Dominio Personalizado',
            'descripcion' => 'Uso de dominio propio (ej. mibarberia.com) además del subdominio SaaS.',
            'categoria' => 'Marca',
        ],
    ];

    public function __construct(
        private readonly TenantContext $tenantContext,
    ) {}

    public function catalog(): array
    {
        $items = [];
        foreach (self::CATALOG as $key => $meta) {
            $items[] = [
                'key' => $key,
                'nombre' => $meta['nombre'],
                'descripcion' => $meta['descripcion'],
                'categoria' => $meta['categoria'],
            ];
        }

        return $items;
    }

    public function defaultsForPlan(string $plan): array
    {
        $esAnual = $plan === 'anual';

        return [
            'pagos_online' => true,
            'spei' => true,
            'multi_barbero' => true,
            'citas_familiares' => true,
            'visagismo' => true,
            'crm_clientes' => true,
            'dominio_propio' => $esAnual,
        ];
    }

    public function allForTenant(?Tenant $tenant): array
    {
        $defaults = $this->defaultsForPlan($tenant?->plan ?: 'anual');
        $overrides = is_array($tenant?->configuracion_extra['features'] ?? null)
            ? $tenant->configuracion_extra['features']
            : [];

        $resolved = [];
        foreach (array_keys(self::CATALOG) as $key) {
            $resolved[$key] = array_key_exists($key, $overrides)
                ? (bool) $overrides[$key]
                : (bool) ($defaults[$key] ?? true);
        }

        return $resolved;
    }

    public function allForCurrentTenant(): array
    {
        return $this->allForTenant($this->tenantContext->current());
    }

    public function active(string $feature, ?Tenant $tenant = null): bool
    {
        $map = $this->allForTenant($tenant ?? $this->tenantContext->current());

        return (bool) ($map[$feature] ?? false);
    }
}
