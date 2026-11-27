<?php

namespace App\Http\Controllers;

use App\Models\BarberoAusencia;
use App\Models\HorarioLaboral;
use App\Models\Servicio;
use App\Models\Usuario;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CitaController extends Controller
{
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $barberos = Usuario::barberos()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido', 'especialidad', 'foto']);

        $ausenciasProximas = Schema::hasTable('barbero_ausencias')
            ? BarberoAusencia::with('barbero:id,nombre,apellido')
                ->where('visible_clientes', true)
                ->proximas()
                ->limit(15)
                ->get()
                ->map(fn (BarberoAusencia $a) => [
                    'id' => $a->id,
                    'barbero_id' => $a->barbero_id,
                    'barbero_nombre' => $a->barbero?->nombre_completo ?? 'Barbero',
                    'fecha_inicio' => $a->fecha_inicio?->toDateString(),
                    'fecha_fin' => $a->fecha_fin?->toDateString(),
                    'motivo' => $a->motivo,
                ])
                ->values()
            : [];

        $pagoConfig = $tenantContext->paymentConfig();

        return Inertia::render('Cita/Index', [
            'serviciosIniciales' => Servicio::where('activo', true)->orderBy('id')->get(),
            'barberosActivos' => $barberos,
            'ausenciasProximas' => $ausenciasProximas,
            'barberoPreferidoId' => $request->user()?->barbero_id,
            'diasCerrados' => HorarioLaboral::diasCerrados(),
            'pagoConfig' => [
                'driver' => $pagoConfig['driver'],
                'anticipo_tipo' => $pagoConfig['anticipo_tipo'],
                'anticipo_valor' => (float) $pagoConfig['anticipo_valor'],
                'spei' => $pagoConfig['spei'],
                'whatsapp_negocio' => $pagoConfig['whatsapp_negocio'],
            ],
            'hoy' => now()->toDateString(),
        ]);
    }
}
