<?php

namespace App\Http\Controllers;

use App\Models\BarberoAusencia;
use App\Models\HorarioLaboral;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(): Response
    {
        $barberos = Usuario::barberos()
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido', 'activo']);

        $ausencias = Schema::hasTable('barbero_ausencias')
            ? BarberoAusencia::with('barbero:id,nombre,apellido')
                ->proximas()
                ->get()
                ->map(fn (BarberoAusencia $a) => [
                    'id' => $a->id,
                    'barbero_id' => $a->barbero_id,
                    'barbero_nombre' => $a->barbero?->nombre_completo ?? 'Barbero',
                    'fecha_inicio' => $a->fecha_inicio?->toDateString(),
                    'fecha_fin' => $a->fecha_fin?->toDateString(),
                    'motivo' => $a->motivo,
                    'visible_clientes' => (bool) $a->visible_clientes,
                ])
                ->values()
            : [];

        return Inertia::render('Horarios/Index', [
            'horarios' => HorarioLaboral::ordenSemana(),
            'barberos' => $barberos,
            'ausencias' => $ausencias,
            'hoy' => now()->toDateString(),
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

        $tenantId = app(TenantContext::class)->id();

        foreach ($validated['horarios'] as $item) {
            if ($item['abierto'] && $item['hora_cierre'] <= $item['hora_apertura']) {
                return back()->withErrors([
                    'horarios' => "En {$item['nombre_dia']}, la hora de cierre debe ser mayor a la hora de apertura.",
                ]);
            }

            HorarioLaboral::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'dia_semana' => (int) $item['dia_semana'],
                ],
                [
                    'nombre_dia' => $item['nombre_dia'],
                    'abierto' => (bool) $item['abierto'],
                    'hora_apertura' => $item['hora_apertura'] . ':00',
                    'hora_cierre' => $item['hora_cierre'] . ':00',
                    'intervalo_minutos' => (int) $item['intervalo_minutos'],
                ]
            );
        }

        BitacoraService::registrar(
            modulo: 'horarios',
            accion: 'horarios_actualizados',
            descripcion: 'Se actualizaron los horarios laborales semanales de la barbería.',
            detalles: ['dias' => $validated['horarios']],
            nivel: 'info',
            entidadTipo: 'HorarioLaboral'
        );

        return redirect('/horarios')->with('exito', 'Horarios laborales actualizados correctamente');
    }

    public function crearAusencia(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'barbero_id' => ['required', 'integer'],
            'fecha_inicio' => ['required', 'date', 'after_or_equal:today'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'motivo' => ['nullable', 'string', 'max:140'],
            'visible_clientes' => ['nullable', 'boolean'],
        ], [
            'barbero_id.required' => 'Selecciona el barbero que se ausentará.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_inicio.after_or_equal' => 'La fecha de inicio debe ser hoy o una fecha futura.',
            'fecha_fin.required' => 'La fecha de fin es obligatoria.',
            'fecha_fin.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
        ]);

        // Verificar que el barbero pertenece al tenant actual (BelongsToTenant)
        $barbero = Usuario::barberos()->where('id', (int) $validated['barbero_id'])->first();
        if (! $barbero) {
            return back()->withErrors([
                'barbero_id' => 'El barbero seleccionado no pertenece a esta barbería.',
            ]);
        }

        $ausencia = BarberoAusencia::create([
            'tenant_id' => app(TenantContext::class)->id(),
            'barbero_id' => $barbero->id,
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin' => $validated['fecha_fin'],
            'motivo' => trim((string) ($validated['motivo'] ?? '')) ?: null,
            'visible_clientes' => (bool) ($validated['visible_clientes'] ?? true),
        ]);

        $rango = $validated['fecha_inicio'] === $validated['fecha_fin']
            ? $validated['fecha_inicio']
            : "{$validated['fecha_inicio']} al {$validated['fecha_fin']}";

        BitacoraService::registrar(
            modulo: 'horarios',
            accion: 'ausencia_barbero_creada',
            descripcion: "Ausencia registrada para {$barbero->nombre_completo} ({$rango}).",
            detalles: [
                'ausencia_id' => $ausencia->id,
                'barbero_id' => $barbero->id,
                'barbero' => $barbero->nombre_completo,
                'fecha_inicio' => $validated['fecha_inicio'],
                'fecha_fin' => $validated['fecha_fin'],
                'motivo' => $ausencia->motivo,
                'visible_clientes' => $ausencia->visible_clientes,
            ],
            nivel: 'info',
            entidadTipo: 'BarberoAusencia',
            entidadId: $ausencia->id
        );

        return redirect('/horarios')->with(
            'exito',
            "Ausencia registrada para {$barbero->nombre_completo} ({$rango})."
        );
    }

    public function eliminarAusencia(BarberoAusencia $ausencia): RedirectResponse
    {
        $barberoNombre = $ausencia->barbero?->nombre_completo ?? "Barbero #{$ausencia->barbero_id}";
        $detalles = [
            'ausencia_id' => $ausencia->id,
            'barbero_id' => $ausencia->barbero_id,
            'barbero' => $barberoNombre,
            'fecha_inicio' => $ausencia->fecha_inicio?->toDateString(),
            'fecha_fin' => $ausencia->fecha_fin?->toDateString(),
        ];

        $ausencia->delete();

        BitacoraService::registrar(
            modulo: 'horarios',
            accion: 'ausencia_barbero_eliminada',
            descripcion: "Ausencia eliminada para {$barberoNombre} ({$detalles['fecha_inicio']} al {$detalles['fecha_fin']}).",
            detalles: $detalles,
            nivel: 'alerta',
            entidadTipo: 'BarberoAusencia',
            entidadId: (int) $detalles['ausencia_id']
        );

        return redirect('/horarios')->with('exito', "Ausencia de {$barberoNombre} eliminada.");
    }
}
