<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Cita extends Model
{
    protected $table = 'citas';

    public $timestamps = false;

    protected $fillable = [
        'fecha',
        'hora',
        'usuarioId',
        'barberoId',
        'para_quien',
        'nombre_beneficiario',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuarioId');
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'barberoId');
    }

    public function servicios(): BelongsToMany
    {
        return $this->belongsToMany(Servicio::class, 'citasServicios', 'citaId', 'servicioId');
    }

    public function pago(): HasOne
    {
        return $this->hasOne(Pago::class, 'citaId')->latestOfMany();
    }
}
