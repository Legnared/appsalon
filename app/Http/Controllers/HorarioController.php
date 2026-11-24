<?php

namespace App\Http\Controllers;

use App\Models\HorarioLaboral;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Horarios/Index', [
            'horarios' => HorarioLaboral::ordenSemana(),
        ]);
    }

    public function actualizar(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'horarios' => ['required', 'array', 'size:7'],
            'horarios.*.dia_semana' => ['required', 'integer', 'between:0,6'],
            'horarios.*.nombre_dia' => ['required', 'string', 'max:20'],
            'horarios.*.abierto' => ['required', 'boolean'],
            'horarios.*.hora_apertura' => ['required', 'date_format:H:i'],
            'horarios.*.hora_cierre' => ['required', 'date_format:H:i'],
            'horarios.*.intervalo_minutos' => ['required', 'integer', 'in:30,45,60'],
        ], [
            'horarios.*.hora_apertura.date_format' => 'Formato de hora de apertura inválido (HH:MM)',
            'horarios.*.hora_cierre.date_format' => 'Formato de hora de cierre inválido (HH:MM)',
        ]);

        foreach ($validated['horarios'] as $item) {
            if ($item['abierto'] && $item['hora_cierre'] <= $item['hora_apertura']) {
                return back()->withErrors([
                    'horarios' => "En {$item['nombre_dia']}, la hora de cierre debe ser mayor a la hora de apertura.",
                ]);
            }

            HorarioLaboral::updateOrCreate(
                ['dia_semana' => (int) $item['dia_semana']],
                [
                    'nombre_dia' => $item['nombre_dia'],
                    'abierto' => (bool) $item['abierto'],
                    'hora_apertura' => $item['hora_apertura'] . ':00',
                    'hora_cierre' => $item['hora_cierre'] . ':00',
                    'intervalo_minutos' => (int) $item['intervalo_minutos'],
                ]
            );
        }

        return redirect('/horarios')->with('exito', 'Horarios laborales actualizados correctamente');
    }
}
