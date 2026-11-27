<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $table = 'tenants';

    protected $fillable = [
        'nombre',
        'slug',
        'dominio_custom',
        'activo',
        'plan',
        'suscripcion_vence_en',
        'tagline',
        'logo',
        'hero_imagen',
        'color_primario',
        'whatsapp_negocio',
        'payment_driver',
        'moneda',
        'anticipo_tipo',
        'anticipo_valor',
        'spei_banco',
        'spei_titular',
        'spei_clabe',
        'mercadopago_access_token',
        'mercadopago_public_key',
        'mercadopago_point_device_id',
        'mercadopago_webhook_url',
        'configuracion_extra',
    ];

    protected $hidden = [
        'mercadopago_access_token',
        'mercadopago_public_key',
    ];

    protected $appends = [
        'logo_url',
        'hero_url',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'anticipo_valor' => 'decimal:2',
            'suscripcion_vence_en' => 'date',
            'mercadopago_access_token' => 'encrypted',
            'mercadopago_public_key' => 'encrypted',
            'configuracion_extra' => 'array',
        ];
    }

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (! $this->logo) {
                    return '/img/icono.png';
                }

                if (str_starts_with($this->logo, '/') || str_starts_with($this->logo, 'http')) {
                    return $this->logo;
                }

                return asset('storage/' . ltrim($this->logo, '/'));
            },
        );
    }

    protected function heroUrl(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                if (! $this->hero_imagen) {
                    return '/img/1.webp';
                }

                if (str_starts_with($this->hero_imagen, '/') || str_starts_with($this->hero_imagen, 'http')) {
                    return $this->hero_imagen;
                }

                return asset('storage/' . ltrim($this->hero_imagen, '/'));
            },
        );
    }

    public function publicUrl(): string
    {
        if (! empty($this->dominio_custom)) {
            $scheme = str_starts_with((string) config('app.url', ''), 'https://') || app()->environment('production')
                ? 'https'
                : 'http';

            return "{$scheme}://{$this->dominio_custom}";
        }

        $baseDomain = trim((string) config('app.base_domain', ''), " .\t\n\r\0\x0B");
        if ($baseDomain !== '') {
            return "https://{$this->slug}.{$baseDomain}";
        }

        return rtrim((string) config('app.url', 'http://localhost'), '/') . '/?tenant=' . urlencode($this->slug);
    }

    public function temaDiseno(): string
    {
        $tema = (string) ($this->configuracion_extra['tema_diseno'] ?? 'rustico_editorial');

        return in_array($tema, ['rustico_editorial', 'moderno_urbano', 'boutique_claro'], true)
            ? $tema
            : 'rustico_editorial';
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'tagline' => $this->tagline ?: 'Estilo & Precisión',
            'logo_url' => $this->logo_url,
            'hero_url' => $this->hero_url,
            'color_primario' => $this->color_primario ?: '#d4a259',
            'tema_diseno' => $this->temaDiseno(),
            'whatsapp_negocio' => $this->whatsapp_negocio ?: (string) config('payments.whatsapp_negocio'),
            'plan' => $this->plan,
        ];
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'tenant_id');
    }

    public function servicios(): HasMany
    {
        return $this->hasMany(Servicio::class, 'tenant_id');
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'tenant_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'tenant_id');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(HorarioLaboral::class, 'tenant_id');
    }
}
