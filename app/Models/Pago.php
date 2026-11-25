<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    use BelongsToTenant;

    protected $table = 'pagos';

    protected $fillable = [
        'tenant_id',
        'citaId',
        'usuarioId',
        'monto',
        'monto_total',
        'monto_pagado',
        'saldo_pendiente',
        'moneda',
        'metodo',
        'tipo_cobro',
        'metodo_liquidacion',
        'gateway',
        'estado',
        'referencia_bancaria',
        'link_pago',
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
            'monto_total' => 'decimal:2',
            'monto_pagado' => 'decimal:2',
            'saldo_pendiente' => 'decimal:2',
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
