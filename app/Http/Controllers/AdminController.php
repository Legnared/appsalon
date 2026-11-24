<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $esSoloBarbero = $user && ! $user->esAdmin() && $user->esBarbero();

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

        $barberoFiltro = $esSoloBarbero
            ? (string) $user->id
            : (string) $request->query('barbero_id', 'todos');

        $query = Cita::with(['usuario', 'barbero:id,nombre,apellido', 'servicios', 'pago'])
            ->where('fecha', $fecha)
            ->orderBy('hora');

        if ($esSoloBarbero) {
            $query->where('barberoId', $user->id);
        } elseif ($barberoFiltro === 'sin_asignar') {
            $query->whereNull('barberoId');
        } elseif (is_numeric($barberoFiltro)) {
            $query->where('barberoId', (int) $barberoFiltro);
        }

        $citas = $query->get()
            ->map(function (Cita $cita) {
                $servicios = $cita->servicios->map(fn ($s) => [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'precio' => (float) $s->precio,
                ])->values();

                $pago = $cita->pago;

                return [
                    'id' => $cita->id,
                    'fecha' => $cita->fecha,
                    'hora' => $cita->hora,
                    'barberoId' => $cita->barberoId,
                    'barbero' => $cita->barbero?->nombre_completo,
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

        $barberos = $esSoloBarbero
            ? []
            : Usuario::barberos()
                ->orderByDesc('activo')
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'apellido', 'activo']);

        return Inertia::render('Admin/Index', [
            'citas' => $citas,
            'fecha' => $fecha,
            'barberos' => $barberos,
            'barberoFiltro' => $barberoFiltro,
            'soloBarbero' => $esSoloBarbero,
        ]);
    }
}
