<?php

namespace App\Http\Controllers;

use App\Models\HorarioLaboral;
use App\Models\Servicio;
use App\Models\Usuario;
use App\Services\TenantContext;
use Illuminate\Http\Request;
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

        $pagoConfig = $tenantContext->paymentConfig();

        return Inertia::render('Cita/Index', [
            'serviciosIniciales' => Servicio::where('activo', true)->orderBy('id')->get(),
            'barberosActivos' => $barberos,
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
