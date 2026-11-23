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

        $citas = Cita::with(['usuario', 'servicios', 'pago'])
            ->where('fecha', $fecha)
            ->orderBy('hora')
            ->get()
            ->map(function (Cita $cita) {
                $servicios = $cita->servicios->map(fn ($s) => [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'precio' => (float) $s->precio,
                ])->values();

                $pago = $cita->pago;

                return [
                    'id' => $cita->id,
                    'hora' => $cita->hora,
                    'cliente' => $cita->usuario?->nombreCompleto ?? 'Sin cliente',
                    'email' => $cita->usuario?->email ?? '',
                    'telefono' => $cita->usuario?->telefono ?? '',
                    'servicios' => $servicios,
                    'total' => $servicios->sum('precio'),
                    'pago' => $pago ? [
                        'id' => $pago->id,
                        'metodo' => $pago->metodo,
                        'estado' => $pago->estado,
                        'monto' => (float) $pago->monto,
                        'moneda' => $pago->moneda,
                        'gateway' => $pago->gateway,
                        'referencia_bancaria' => $pago->referencia_bancaria,
                        'codigo_autorizacion' => $pago->codigo_autorizacion,
                        'ultimos_4' => $pago->ultimos_4,
                        'marca_tarjeta' => $pago->marca_tarjeta,
                        'terminal_id' => $pago->terminal_id,
                    ] : null,
                ];
            })
            ->values();

        return Inertia::render('Admin/Index', [
            'citas' => $citas,
            'fecha' => $fecha,
        ]);
    }
}
