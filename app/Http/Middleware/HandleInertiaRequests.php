<?php

namespace App\Http\Middleware;

use App\Models\Cita;
use App\Services\FeatureManager;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $esCliente = $user && ! ((bool) ($user->admin ?? false) || ($user->rol ?? null) === 'admin' || ($user->rol ?? null) === 'barbero');

        return [
            ...parent::share($request),
            'tenant' => fn () => app(TenantContext::class)->frontendPayload(),
            'features' => fn () => app(FeatureManager::class)->allForCurrentTenant(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'nombre' => $user->nombre ?? $user->name ?? '',
                    'apellido' => $user->apellido ?? '',
                    'nombreCompleto' => trim(($user->nombre ?? $user->name ?? '') . ' ' . ($user->apellido ?? '')),
                    'email' => $user->email,
                    'admin' => (bool) ($user->admin ?? false) || ($user->rol ?? null) === 'admin',
                    'es_barbero' => (bool) ($user->es_barbero ?? false),
                    'puede_ver_bitacora' => $user->puedeVerBitacora(),
                    'rol' => $user->rol ?? ((bool) ($user->admin ?? false) ? 'admin' : 'cliente'),
                    'foto_url' => $user->foto_url ?? null,
                ] : null,
            ],
            'misReservaciones' => fn () => $esCliente
                ? Cita::with(['barbero:id,nombre,apellido', 'servicios:id,nombre,precio', 'pago'])
                    ->where('usuarioId', $user->id)
                    ->whereDate('fecha', '>=', now()->toDateString())
                    ->orderBy('fecha')
                    ->orderBy('hora')
                    ->limit(8)
                    ->get()
                    ->map(fn (Cita $cita) => [
                        'id' => $cita->id,
                        'fecha' => $cita->fecha,
                        'hora' => substr((string) $cita->hora, 0, 5),
                        'barbero' => $cita->barbero?->nombre_completo,
                        'para_quien' => $cita->para_quien ?? 'titular',
                        'nombre_beneficiario' => $cita->nombre_beneficiario,
                        'servicios_nombres' => $cita->servicios->pluck('nombre')->values(),
                        'total' => (float) $cita->servicios->sum('precio'),
                        'pago_estado' => $cita->pago?->estado ?? 'pendiente',
                        'pago_metodo' => $cita->pago?->metodo ?? 'terminal_pos',
                        'monto_pagado' => (float) ($cita->pago?->monto_pagado ?? 0),
                        'saldo_pendiente' => (float) ($cita->pago?->saldo_pendiente ?? $cita->servicios->sum('precio')),
                    ])
                    ->values()
                : [],
            'flash' => [
                'exito' => fn () => $request->session()->get('exito'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
