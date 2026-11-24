<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Servicio extends Model
{
    protected $table = 'servicios';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'precio',
        'descripcion',
        'imagen',
        'duracion_minutos',
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
            'activo' => 'boolean',
            'tipos_rostro' => 'array',
        ];
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
