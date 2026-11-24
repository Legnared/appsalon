<?php

namespace App\Http\Controllers;

use App\Models\BitacoraEvento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BitacoraController extends Controller
{
    /**
     * Vista 100% solo lectura para el Administrador.
     */
    public function index(Request $request): Response
    {
        $modulo = (string) $request->query('modulo', 'todos');
        $nivel = (string) $request->query('nivel', 'todos');
        $fechaDesde = (string) $request->query('fecha_desde', '');
        $fechaHasta = (string) $request->query('fecha_hasta', '');
        $q = trim((string) $request->query('q', ''));

        $query = BitacoraEvento::query()->orderByDesc('id');

        if ($modulo !== '' && $modulo !== 'todos') {
            $query->where('modulo', $modulo);
        }

        if ($nivel !== '' && $nivel !== 'todos') {
            $query->where('nivel', $nivel);
        }

        if ($fechaDesde !== '' && strtotime($fechaDesde)) {
            $query->whereDate('created_at', '>=', $fechaDesde);
        }

        if ($fechaHasta !== '' && strtotime($fechaHasta)) {
            $query->whereDate('created_at', '<=', $fechaHasta);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('descripcion', 'like', "%{$q}%")
                    ->orWhere('accion', 'like', "%{$q}%")
                    ->orWhere('usuario_nombre', 'like', "%{$q}%")
                    ->orWhere('entidad_tipo', 'like', "%{$q}%")
                    ->orWhere('ip_address', 'like', "%{$q}%");
            });
        }

        $eventos = $query->paginate(25)->withQueryString()->through(fn (BitacoraEvento $e) => [
            'id' => $e->id,
            'modulo' => $e->modulo,
            'accion' => $e->accion,
            'nivel' => $e->nivel,
            'descripcion' => $e->descripcion,
            'usuario_id' => $e->usuario_id,
            'usuario_nombre' => $e->usuario_nombre ?? 'Sistema',
            'usuario_rol' => $e->usuario_rol ?? 'sistema',
            'entidad_tipo' => $e->entidad_tipo,
            'entidad_id' => $e->entidad_id,
            'ip_address' => $e->ip_address,
            'user_agent' => $e->user_agent,
            'detalles' => $e->detalles,
            'fecha_hora' => $e->created_at?->format('Y-m-d H:i:s'),
        ]);

        $resumen = [
            'total' => BitacoraEvento::count(),
            'pagos' => BitacoraEvento::where('modulo', 'pagos')->count(),
            'alertas_errores' => BitacoraEvento::whereIn('nivel', ['alerta', 'error'])->count(),
            'hoy' => BitacoraEvento::whereDate('created_at', now()->toDateString())->count(),
        ];

        return Inertia::render('Bitacora/Index', [
            'eventos' => $eventos,
            'resumen' => $resumen,
            'filtros' => [
                'modulo' => $modulo,
                'nivel' => $nivel,
                'fecha_desde' => $fechaDesde,
                'fecha_hasta' => $fechaHasta,
                'q' => $q,
            ],
        ]);
    }
}
