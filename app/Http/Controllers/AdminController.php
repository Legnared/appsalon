<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(Request $request): Response
    {
        $fecha = (string) $request->query('fecha', now()->toDateString());
        $partes = explode('-', $fecha);

        if (
            count($partes) !== 3 ||
            ! ctype_digit($partes[0]) ||
            ! ctype_digit($partes[1]) ||
            ! ctype_digit($partes[2]) ||
            ! checkdate((int) $partes[1], (int) $partes[2], (int) $partes[0])
        ) {
            abort(404);
        }

        $citas = Cita::with(['usuario', 'servicios'])
            ->where('fecha', $fecha)
            ->orderBy('hora')
            ->get()
            ->map(function (Cita $cita) {
                $servicios = $cita->servicios->map(fn ($s) => [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'precio' => (float) $s->precio,
                ])->values();

                return [
                    'id' => $cita->id,
                    'hora' => $cita->hora,
                    'cliente' => $cita->usuario?->nombreCompleto ?? 'Sin cliente',
                    'email' => $cita->usuario?->email ?? '',
                    'telefono' => $cita->usuario?->telefono ?? '',
                    'servicios' => $servicios,
                    'total' => $servicios->sum('precio'),
                ];
            })
            ->values();

        return Inertia::render('Admin/Index', [
            'citas' => $citas,
            'fecha' => $fecha,
        ]);
    }
}
