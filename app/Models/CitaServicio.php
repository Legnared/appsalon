<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CitaServicio extends Model
{
    protected $table = 'citasServicios';

    public $timestamps = false;

    protected $fillable = [
        'citaId',
        'servicioId',
    ];

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'citaId');
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class, 'servicioId');
    }
}
