<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Servicio extends Model
{
    protected $table = 'servicios';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'precio',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
        ];
    }

    public function citas(): BelongsToMany
    {
        return $this->belongsToMany(Cita::class, 'citasServicios', 'servicioId', 'citaId');
    }
}
