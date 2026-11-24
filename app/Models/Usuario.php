<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'apellido',
        'email',
        'password',
        'telefono',
        'admin',
        'rol',
        'es_barbero',
        'especialidad',
        'foto',
        'activo',
        'barbero_id',
        'confirmado',
        'token',
    ];

    protected $appends = [
        'foto_url',
        'nombre_completo',
    ];

    protected $hidden = [
        'password',
        'token',
    ];

    protected function casts(): array
    {
        return [
            'admin' => 'boolean',
            'es_barbero' => 'boolean',
            'activo' => 'boolean',
            'confirmado' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected function nombreCompleto(): Attribute
    {
        return Attribute::make(
            get: fn () => trim(($this->nombre ?? '') . ' ' . ($this->apellido ?? '')),
        );
    }

    protected function fotoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->foto ? asset('storage/' . ltrim($this->foto, '/')) : null,
        );
    }

    public function esAdmin(): bool
    {
        return (bool) $this->admin || $this->rol === 'admin';
    }

    public function esBarbero(): bool
    {
        return $this->rol === 'barbero' || (bool) $this->es_barbero;
    }

    public function esCliente(): bool
    {
        return ! $this->esAdmin() && ! $this->esBarbero();
    }

    public function scopeBarberos(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('rol', 'barbero')->orWhere('es_barbero', true);
        });
    }

    public function scopeClientes(Builder $query): Builder
    {
        return $query->where('rol', 'cliente')->where(function (Builder $q) {
            $q->where('admin', false)->orWhereNull('admin');
        });
    }

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'usuarioId');
    }

    public function citasComoBarbero(): HasMany
    {
        return $this->hasMany(Cita::class, 'barberoId');
    }

    public function barberoAsignado(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'barbero_id');
    }

    public function clientesAsignados(): HasMany
    {
        return $this->hasMany(Usuario::class, 'barbero_id');
    }

    public function crearToken(): string
    {
        $this->token = uniqid();

        return $this->token;
    }
}
