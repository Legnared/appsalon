<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class BarberoAusencia extends Model
{
    use BelongsToTenant;

    protected $table = 'barbero_ausencias';

    protected $fillable = [
        'tenant_id',
        'barbero_id',
        'fecha_inicio',
        'fecha_fin',
        'motivo',
        'visible_clientes',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date:Y-m-d',
            'fecha_fin' => 'date:Y-m-d',
            'visible_clientes' => 'boolean',
        ];
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'barbero_id');
    }

    public function scopeEnFecha(Builder $query, string $fecha): Builder
    {
        return $query->whereDate('fecha_inicio', '<=', $fecha)
            ->whereDate('fecha_fin', '>=', $fecha);
    }

    public function scopeProximas(Builder $query): Builder
    {
        return $query->whereDate('fecha_fin', '>=', now()->toDateString())
            ->orderBy('fecha_inicio')
            ->orderBy('id');
    }

    public static function barberoAusenteEnFecha(?int $barberoId, string $fecha): ?self
    {
        if (! $barberoId || $fecha === '' || ! Schema::hasTable('barbero_ausencias')) {
            return null;
        }

        return self::with('barbero:id,nombre,apellido')
            ->where('barbero_id', $barberoId)
            ->enFecha($fecha)
            ->first();
    }
}
