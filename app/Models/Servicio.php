<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Servicio extends Model
{
    use BelongsToTenant;

    protected $table = 'servicios';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'nombre',
        'tipo',
        'precio',
        'descripcion',
        'imagen',
        'duracion_minutos',
        'stock',
        'activo',
        'tipos_rostro',
        'recomendacion_rostro',
    ];

    protected $appends = [
        'imagen_url',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'duracion_minutos' => 'integer',
            'stock' => 'integer',
            'activo' => 'boolean',
            'tipos_rostro' => 'array',
        ];
    }

    public function esProducto(): bool
    {
        return ($this->tipo ?? 'servicio') === 'producto';
    }

    protected function imagenUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->imagen ? asset('storage/' . ltrim($this->imagen, '/')) : null,
        );
    }

    public function citas(): BelongsToMany
    {
        return $this->belongsToMany(Cita::class, 'citasServicios', 'servicioId', 'citaId');
    }
}
