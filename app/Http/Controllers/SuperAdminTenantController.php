<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\HorarioLaboral;
use App\Models\Servicio;
use App\Models\Tenant;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\FeatureManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminTenantController extends Controller
{
    public function __construct(
        private readonly FeatureManager $features,
    ) {}

    public function index(): Response
    {
        $tenants = Tenant::orderBy('id')->get();

        $citasPorTenant = Cita::withoutGlobalScope('tenant')
            ->selectRaw('tenant_id, COUNT(*) as total')
            ->groupBy('tenant_id')
            ->pluck('total', 'tenant_id');

        $usuariosPorTenant = Usuario::withoutGlobalScope('tenant')
            ->selectRaw('tenant_id, COUNT(*) as total')
            ->groupBy('tenant_id')
            ->pluck('total', 'tenant_id');

        $serviciosPorTenant = Servicio::withoutGlobalScope('tenant')
            ->selectRaw('tenant_id, COUNT(*) as total')
            ->groupBy('tenant_id')
            ->pluck('total', 'tenant_id');

        $lista = $tenants->map(function (Tenant $t) use ($citasPorTenant, $usuariosPorTenant, $serviciosPorTenant) {
            $flags = $this->features->allForTenant($t);

            return [
                'id' => $t->id,
                'nombre' => $t->nombre,
                'slug' => $t->slug,
                'dominio_custom' => $t->dominio_custom,
                'activo' => (bool) $t->activo,
                'plan' => $t->plan,
                'suscripcion_vence_en' => $t->suscripcion_vence_en?->format('Y-m-d'),
                'color_primario' => $t->color_primario ?: '#d4a259',
                'whatsapp_negocio' => $t->whatsapp_negocio,
                'payment_driver' => $t->payment_driver,
                'citas_count' => (int) ($citasPorTenant[$t->id] ?? 0),
                'usuarios_count' => (int) ($usuariosPorTenant[$t->id] ?? 0),
                'servicios_count' => (int) ($serviciosPorTenant[$t->id] ?? 0),
                'modulos_activos' => count(array_filter($flags)),
                'modulos_total' => count($flags),
                'created_at' => $t->created_at?->format('Y-m-d'),
            ];
        })->values();

        $resumen = [
            'total_barberias' => $tenants->count(),
            'activas' => $tenants->where('activo', true)->count(),
            'plan_anual' => $tenants->where('plan', 'anual')->count(),
            'citas_globales' => (int) $citasPorTenant->sum(),
        ];

        return Inertia::render('SuperAdmin/Index', [
            'tenants' => $lista,
            'resumen' => $resumen,
        ]);
    }

    public function showCrear(): Response
    {
        return Inertia::render('SuperAdmin/Form', [
            'modo' => 'crear',
            'tenant' => null,
            'featuresCatalog' => $this->features->catalog(),
            'featuresActivos' => $this->features->defaultsForPlan('anual'),
        ]);
    }

    public function crear(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:tenants,slug'],
            'dominio_custom' => ['nullable', 'string', 'max:190', 'unique:tenants,dominio_custom'],
            'plan' => ['required', 'in:trial,mensual,anual'],
            'suscripcion_vence_en' => ['nullable', 'date'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'color_primario' => ['nullable', 'string', 'max:20'],
            'whatsapp_negocio' => ['nullable', 'string', 'max:30'],
            'payment_driver' => ['required', 'in:sandbox,mercadopago,bank_api'],
            'anticipo_tipo' => ['required', 'in:fijo,porcentaje'],
            'anticipo_valor' => ['required', 'numeric', 'min:0'],
            'spei_banco' => ['nullable', 'string', 'max:100'],
            'spei_titular' => ['nullable', 'string', 'max:120'],
            'spei_clabe' => ['nullable', 'string', 'max:30'],
            'features' => ['nullable', 'array'],
            // Dueño inicial de la barbería
            'dueno_nombre' => ['required', 'string', 'max:60'],
            'dueno_apellido' => ['nullable', 'string', 'max:60'],
            'dueno_email' => ['required', 'email', 'max:60'],
            'dueno_password' => ['required', 'string', 'min:6'],
            'dueno_telefono' => ['nullable', 'string', 'max:25'],
            'sembrar_servicios_base' => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El nombre de la barbería es obligatorio.',
            'slug.required' => 'El slug (subdominio) es obligatorio.',
            'slug.unique' => 'Ya existe otra barbería con ese slug.',
            'dueno_nombre.required' => 'El nombre del dueño es obligatorio.',
            'dueno_email.required' => 'El correo del dueño es obligatorio.',
            'dueno_password.required' => 'La contraseña inicial del dueño es obligatoria.',
            'dueno_password.min' => 'La contraseña inicial debe tener al menos 6 caracteres.',
        ]);

        $slug = Str::lower(trim($validated['slug']));
        $dominio = ! empty($validated['dominio_custom'])
            ? Str::lower(trim($validated['dominio_custom']))
            : null;

        $featureMap = $this->sanitizeFeatures($validated['features'] ?? [], $validated['plan']);

        $tenant = DB::transaction(function () use ($validated, $slug, $dominio, $featureMap, $request) {
            $tenant = Tenant::create([
                'nombre' => trim($validated['nombre']),
                'slug' => $slug,
                'dominio_custom' => $dominio,
                'activo' => true,
                'plan' => $validated['plan'],
                'suscripcion_vence_en' => $validated['suscripcion_vence_en'] ?? ($validated['plan'] === 'anual' ? now()->addYear()->toDateString() : now()->addMonth()->toDateString()),
                'tagline' => $validated['tagline'] ?: 'Corte Clásico · Barba · Estilo',
                'color_primario' => $validated['color_primario'] ?: '#d4a259',
                'whatsapp_negocio' => $validated['whatsapp_negocio'] ?? null,
                'payment_driver' => $validated['payment_driver'],
                'moneda' => 'MXN',
                'anticipo_tipo' => $validated['anticipo_tipo'],
                'anticipo_valor' => (float) $validated['anticipo_valor'],
                'spei_banco' => $validated['spei_banco'] ?? null,
                'spei_titular' => $validated['spei_titular'] ?? null,
                'spei_clabe' => $validated['spei_clabe'] ?? null,
                'configuracion_extra' => ['features' => $featureMap],
            ]);

            // 1. Crear cuenta de Dueño / Admin Operativo (es_barbero = true → sin acceso a Bitácora ni Super-Admin)
            Usuario::withoutGlobalScope('tenant')->create([
                'tenant_id' => $tenant->id,
                'nombre' => trim($validated['dueno_nombre']),
                'apellido' => trim((string) ($validated['dueno_apellido'] ?? '')),
                'email' => Str::lower(trim($validated['dueno_email'])),
                'password' => $validated['dueno_password'],
                'telefono' => trim((string) ($validated['dueno_telefono'] ?? '')),
                'admin' => true,
                'rol' => 'admin',
                'es_barbero' => true,
                'especialidad' => 'Master Barber & Fundador',
                'activo' => true,
                'confirmado' => true,
                'token' => null,
            ]);

            // 2. Sembrar horarios laborales iniciales (L-S 10:00–19:00, Domingo cerrado)
            $dias = [
                [1, 'Lunes', true, '10:00:00', '19:00:00'],
                [2, 'Martes', true, '10:00:00', '19:00:00'],
                [3, 'Miércoles', true, '10:00:00', '19:00:00'],
                [4, 'Jueves', true, '10:00:00', '19:00:00'],
                [5, 'Viernes', true, '10:00:00', '19:00:00'],
                [6, 'Sábado', true, '10:00:00', '19:00:00'],
                [0, 'Domingo', false, '10:00:00', '16:00:00'],
            ];

            foreach ($dias as [$diaSemana, $nombreDia, $abierto, $apertura, $cierre]) {
                HorarioLaboral::withoutGlobalScope('tenant')->create([
                    'tenant_id' => $tenant->id,
                    'dia_semana' => $diaSemana,
                    'nombre_dia' => $nombreDia,
                    'abierto' => $abierto,
                    'hora_apertura' => $apertura,
                    'hora_cierre' => $cierre,
                    'intervalo_minutos' => 60,
                ]);
            }

            // 3. Servicios base opcionales para arrancar de inmediato
            if ($request->boolean('sembrar_servicios_base', true)) {
                $serviciosBase = [
                    ['Corte Clásico / Fade', 200.00, 40, 'Corte personalizado con máquina y tijera, terminado a navaja.'],
                    ['Corte + Perfilado de Barba', 320.00, 60, 'Servicio completo con toalla caliente y perfilado de precisión.'],
                    ['Perfilado de Barba', 150.00, 30, 'Diseño, rebaje y delineado con bálsamo hidratante.'],
                    ['Corte Niño / Junior', 160.00, 30, 'Corte cómodo y moderno para niños y jóvenes.'],
                ];

                foreach ($serviciosBase as [$nombreServ, $precio, $duracion, $desc]) {
                    Servicio::withoutGlobalScope('tenant')->create([
                        'tenant_id' => $tenant->id,
                        'nombre' => $nombreServ,
                        'precio' => $precio,
                        'duracion_minutos' => $duracion,
                        'descripcion' => $desc,
                        'activo' => true,
                    ]);
                }
            }

            return $tenant;
        });

        BitacoraService::registrar(
            modulo: 'tenants',
            accion: 'tenant_creado',
            descripcion: "Nueva barbería SaaS registrada: {$tenant->nombre} ({$tenant->slug}, plan {$tenant->plan}).",
            detalles: ['tenant_id' => $tenant->id, 'slug' => $tenant->slug, 'plan' => $tenant->plan],
            nivel: 'exito',
            entidadTipo: 'Tenant',
            entidadId: $tenant->id
        );

        return redirect('/super-admin')->with('exito', "Barbería '{$tenant->nombre}' creada y lista para operar.");
    }

    public function showEditar(Tenant $tenant): Response
    {
        return Inertia::render('SuperAdmin/Form', [
            'modo' => 'editar',
            'tenant' => [
                'id' => $tenant->id,
                'nombre' => $tenant->nombre,
                'slug' => $tenant->slug,
                'dominio_custom' => $tenant->dominio_custom ?? '',
                'activo' => (bool) $tenant->activo,
                'plan' => $tenant->plan,
                'suscripcion_vence_en' => $tenant->suscripcion_vence_en?->format('Y-m-d') ?? '',
                'tagline' => $tenant->tagline ?? '',
                'color_primario' => $tenant->color_primario ?: '#d4a259',
                'whatsapp_negocio' => $tenant->whatsapp_negocio ?? '',
                'payment_driver' => $tenant->payment_driver ?: 'sandbox',
                'anticipo_tipo' => $tenant->anticipo_tipo ?: 'fijo',
                'anticipo_valor' => (float) ($tenant->anticipo_valor ?? 100),
                'spei_banco' => $tenant->spei_banco ?? '',
                'spei_titular' => $tenant->spei_titular ?? '',
                'spei_clabe' => $tenant->spei_clabe ?? '',
                'mercadopago_point_device_id' => $tenant->mercadopago_point_device_id ?? '',
                'mercadopago_webhook_url' => $tenant->mercadopago_webhook_url ?? '',
                'tiene_mp_token' => ! empty($tenant->mercadopago_access_token),
            ],
            'featuresCatalog' => $this->features->catalog(),
            'featuresActivos' => $this->features->allForTenant($tenant),
        ]);
    }

    public function actualizar(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', Rule::unique('tenants', 'slug')->ignore($tenant->id)],
            'dominio_custom' => ['nullable', 'string', 'max:190', Rule::unique('tenants', 'dominio_custom')->ignore($tenant->id)],
            'activo' => ['required', 'boolean'],
            'plan' => ['required', 'in:trial,mensual,anual'],
            'suscripcion_vence_en' => ['nullable', 'date'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'color_primario' => ['nullable', 'string', 'max:20'],
            'whatsapp_negocio' => ['nullable', 'string', 'max:30'],
            'payment_driver' => ['required', 'in:sandbox,mercadopago,bank_api'],
            'anticipo_tipo' => ['required', 'in:fijo,porcentaje'],
            'anticipo_valor' => ['required', 'numeric', 'min:0'],
            'spei_banco' => ['nullable', 'string', 'max:100'],
            'spei_titular' => ['nullable', 'string', 'max:120'],
            'spei_clabe' => ['nullable', 'string', 'max:30'],
            'mercadopago_access_token' => ['nullable', 'string', 'max:255'],
            'mercadopago_public_key' => ['nullable', 'string', 'max:255'],
            'mercadopago_point_device_id' => ['nullable', 'string', 'max:120'],
            'mercadopago_webhook_url' => ['nullable', 'string', 'max:255'],
            'features' => ['nullable', 'array'],
        ]);

        $extra = is_array($tenant->configuracion_extra) ? $tenant->configuracion_extra : [];
        $extra['features'] = $this->sanitizeFeatures($validated['features'] ?? [], $validated['plan']);

        $datos = [
            'nombre' => trim($validated['nombre']),
            'slug' => Str::lower(trim($validated['slug'])),
            'dominio_custom' => ! empty($validated['dominio_custom']) ? Str::lower(trim($validated['dominio_custom'])) : null,
            'activo' => (bool) $validated['activo'],
            'plan' => $validated['plan'],
            'suscripcion_vence_en' => $validated['suscripcion_vence_en'] ?: null,
            'tagline' => $validated['tagline'] ?: null,
            'color_primario' => $validated['color_primario'] ?: '#d4a259',
            'whatsapp_negocio' => $validated['whatsapp_negocio'] ?: null,
            'payment_driver' => $validated['payment_driver'],
            'anticipo_tipo' => $validated['anticipo_tipo'],
            'anticipo_valor' => (float) $validated['anticipo_valor'],
            'spei_banco' => $validated['spei_banco'] ?: null,
            'spei_titular' => $validated['spei_titular'] ?: null,
            'spei_clabe' => $validated['spei_clabe'] ?: null,
            'mercadopago_point_device_id' => $validated['mercadopago_point_device_id'] ?: null,
            'mercadopago_webhook_url' => $validated['mercadopago_webhook_url'] ?: null,
            'configuracion_extra' => $extra,
        ];

        if (! empty($validated['mercadopago_access_token'])) {
            $datos['mercadopago_access_token'] = trim($validated['mercadopago_access_token']);
        }
        if (! empty($validated['mercadopago_public_key'])) {
            $datos['mercadopago_public_key'] = trim($validated['mercadopago_public_key']);
        }

        $tenant->update($datos);

        BitacoraService::registrar(
            modulo: 'tenants',
            accion: 'tenant_actualizado',
            descripcion: "Configuración y módulos actualizados para {$tenant->nombre} (plan {$tenant->plan}).",
            detalles: ['tenant_id' => $tenant->id, 'activo' => $tenant->activo, 'features' => $extra['features']],
            nivel: 'info',
            entidadTipo: 'Tenant',
            entidadId: $tenant->id
        );

        return redirect('/super-admin')->with('exito', "Barbería '{$tenant->nombre}' actualizada correctamente.");
    }

    public function previsualizar(Request $request, Tenant $tenant): RedirectResponse
    {
        $request->session()->put('superadmin_preview_tenant_slug', $tenant->slug);

        if (app()->environment(['local', 'testing'])) {
            $request->session()->put('dev_tenant_slug', $tenant->slug);
        }

        return redirect('/admin')->with('exito', "Previsualizando '{$tenant->nombre}' ({$tenant->slug}).");
    }

    public function toggleActivo(Request $request, Tenant $tenant): RedirectResponse
    {
        $tenant->activo = ! $tenant->activo;
        $tenant->save();

        if (! $tenant->activo && $request->hasSession()) {
            if ($request->session()->get('superadmin_preview_tenant_slug') === $tenant->slug) {
                $request->session()->forget('superadmin_preview_tenant_slug');
            }
            if ($request->session()->get('dev_tenant_slug') === $tenant->slug) {
                $request->session()->forget('dev_tenant_slug');
            }
        }

        $estadoTexto = $tenant->activo ? 'reactivada' : 'suspendida';

        BitacoraService::registrar(
            modulo: 'tenants',
            accion: $tenant->activo ? 'tenant_activado' : 'tenant_suspendido',
            descripcion: "Suscripción de '{$tenant->nombre}' {$estadoTexto} por Super-Admin.",
            detalles: ['tenant_id' => $tenant->id, 'activo' => $tenant->activo],
            nivel: $tenant->activo ? 'exito' : 'alerta',
            entidadTipo: 'Tenant',
            entidadId: $tenant->id
        );

        return back()->with('exito', "Barbería '{$tenant->nombre}' {$estadoTexto}.");
    }

    private function sanitizeFeatures(array $input, string $plan): array
    {
        $defaults = $this->features->defaultsForPlan($plan);
        $clean = [];

        foreach (array_keys(FeatureManager::CATALOG) as $key) {
            $clean[$key] = array_key_exists($key, $input)
                ? filter_var($input[$key], FILTER_VALIDATE_BOOLEAN)
                : (bool) ($defaults[$key] ?? true);
        }

        return $clean;
    }
}
