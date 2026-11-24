<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraEvento extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'bitacora_eventos';

    protected $fillable = [
        'modulo',
        'accion',
        'nivel',
        'descripcion',
        'usuario_id',
        'usuario_nombre',
        'usuario_rol',
        'entidad_tipo',
        'entidad_id',
        'ip_address',
        'user_agent',
        'detalles',
        'created_at',
    ];

    protected $casts = [
        'detalles' => 'array',
        'created_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
