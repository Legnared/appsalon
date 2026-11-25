<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class HorarioLaboral extends Model
{
    use BelongsToTenant;

    protected $table = 'horarios_laborales';

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'dia_semana',
        'nombre_dia',
        'abierto',
        'hora_apertura',
        'hora_cierre',
        'intervalo_minutos',
    ];

    protected function casts(): array
    {
        return [
            'dia_semana' => 'integer',
            'abierto' => 'boolean',
            'intervalo_minutos' => 'integer',
        ];
    }

    public static function ordenSemana(): Collection
    {
        if (! Schema::hasTable('horarios_laborales')) {
            return collect(self::defaults());
        }

        $registros = self::all()->keyBy('dia_semana');
        $orden = [1, 2, 3, 4, 5, 6, 0];

        return collect($orden)->map(function (int $dia) use ($registros) {
            $item = $registros->get($dia);
            if ($item) {
                return [
                    'dia_semana' => $item->dia_semana,
                    'nombre_dia' => $item->nombre_dia,
                    'abierto' => (bool) $item->abierto,
                    'hora_apertura' => substr((string) $item->hora_apertura, 0, 5),
                    'hora_cierre' => substr((string) $item->hora_cierre, 0, 5),
                    'intervalo_minutos' => (int) ($item->intervalo_minutos ?: 60),
                ];
            }

            return collect(self::defaults())->firstWhere('dia_semana', $dia);
        })->values();
    }

    public static function porDia(int $diaSemana): array
    {
        if (Schema::hasTable('horarios_laborales')) {
            $item = self::where('dia_semana', $diaSemana)->first();
            if ($item) {
                return [
                    'dia_semana' => $item->dia_semana,
                    'nombre_dia' => $item->nombre_dia,
                    'abierto' => (bool) $item->abierto,
                    'hora_apertura' => substr((string) $item->hora_apertura, 0, 5),
                    'hora_cierre' => substr((string) $item->hora_cierre, 0, 5),
                    'intervalo_minutos' => (int) ($item->intervalo_minutos ?: 60),
                ];
            }
        }

        return collect(self::defaults())->firstWhere('dia_semana', $diaSemana)
            ?? ['dia_semana' => $diaSemana, 'nombre_dia' => 'Día', 'abierto' => $diaSemana !== 0, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60];
    }

    public static function diasCerrados(): array
    {
        return self::ordenSemana()
            ->filter(fn (array $d) => ! $d['abierto'])
            ->pluck('dia_semana')
            ->values()
            ->all();
    }

    private static function defaults(): array
    {
        return [
            ['dia_semana' => 1, 'nombre_dia' => 'Lunes', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 2, 'nombre_dia' => 'Martes', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 3, 'nombre_dia' => 'Miércoles', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 4, 'nombre_dia' => 'Jueves', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 5, 'nombre_dia' => 'Viernes', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 6, 'nombre_dia' => 'Sábado', 'abierto' => true, 'hora_apertura' => '10:00', 'hora_cierre' => '19:00', 'intervalo_minutos' => 60],
            ['dia_semana' => 0, 'nombre_dia' => 'Domingo', 'abierto' => false, 'hora_apertura' => '10:00', 'hora_cierre' => '16:00', 'intervalo_minutos' => 60],
        ];
    }
}
