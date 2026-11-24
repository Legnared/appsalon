<?php

namespace App\Http\Controllers;

use App\Models\HorarioLaboral;
use App\Models\Servicio;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CitaController extends Controller
{
    public function index(Request $request): Response
    {
        $barberos = Usuario::barberos()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido', 'especialidad', 'foto']);

        return Inertia::render('Cita/Index', [
            'serviciosIniciales' => Servicio::where('activo', true)->orderBy('id')->get(),
            'barberosActivos' => $barberos,
            'barberoPreferidoId' => $request->user()?->barbero_id,
            'diasCerrados' => HorarioLaboral::diasCerrados(),
            'pagoConfig' => [
                'driver' => config('payments.default', 'sandbox'),
                'anticipo_tipo' => config('payments.anticipo.tipo', 'fijo'),
                'anticipo_valor' => (float) config('payments.anticipo.valor', 100),
                'spei' => config('payments.spei'),
                'whatsapp_negocio' => config('payments.whatsapp_negocio'),
            ],
            'hoy' => now()->toDateString(),
        ]);
    }
}
