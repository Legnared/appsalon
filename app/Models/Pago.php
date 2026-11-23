<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'citaId',
        'usuarioId',
        'monto',
        'moneda',
        'metodo',
        'gateway',
        'estado',
        'referencia_bancaria',
        'codigo_autorizacion',
        'ultimos_4',
        'marca_tarjeta',
        'terminal_id',
        'respuesta_payload',
        'pagado_en',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'respuesta_payload' => 'array',
            'pagado_en' => 'datetime',
        ];
    }

    public function cita(): BelongsTo
    {
        return $this->belongsTo(Cita::class, 'citaId');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuarioId');
    }
}
