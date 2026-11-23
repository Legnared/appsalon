<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
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
        'confirmado',
        'token',
    ];

    protected $hidden = [
        'password',
        'token',
    ];

    protected function casts(): array
    {
        return [
            'admin' => 'boolean',
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

    public function citas(): HasMany
    {
        return $this->hasMany(Cita::class, 'usuarioId');
    }

    public function crearToken(): string
    {
        $this->token = uniqid();

        return $this->token;
    }
}
