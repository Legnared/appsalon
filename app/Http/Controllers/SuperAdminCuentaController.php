<?php

namespace App\Http\Controllers;

use App\Mail\ReestablecerPasswordMail;
use App\Models\Tenant;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SuperAdminCuentaController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        $totalSuperAdmins = Usuario::withoutGlobalScope('tenant')
            ->where('admin', true)
            ->where(fn ($q) => $q->where('es_barbero', false)->orWhereNull('es_barbero'))
            ->count();

        $totalDuenos = Usuario::withoutGlobalScope('tenant')
            ->where('admin', true)
            ->where('es_barbero', true)
            ->count();

        $totalBarberos = Usuario::withoutGlobalScope('tenant')
            ->where('rol', 'barbero')
            ->where(fn ($q) => $q->where('admin', false)->orWhereNull('admin'))
            ->count();

        $totalClientes = Usuario::withoutGlobalScope('tenant')
            ->where('rol', 'cliente')
            ->where(fn ($q) => $q->where('admin', false)->orWhereNull('admin'))
            ->count();

        $matrizRoles = [
            [
                'rol' => 'Super-Admin Técnico',
                'identificador' => 'admin=1, es_barbero=0',
                'usuarios' => $totalSuperAdmins,
                'alcance' => 'Global (todas las barberías)',
                'permisos' => [
                    'super_admin' => true,
                    'bitacora' => true,
                    'agenda_barberia' => true,
                    'servicios_horarios' => true,
                    'barberos_crm' => true,
                    'mi_marca' => true,
                    'agendar_citas' => false,
                ],
            ],
            [
                'rol' => 'Dueño / Admin Barbería',
                'identificador' => 'admin=1, es_barbero=1',
                'usuarios' => $totalDuenos,
                'alcance' => 'Solo su barbería (tenant_id)',
                'permisos' => [
                    'super_admin' => false,
                    'bitacora' => false,
                    'agenda_barberia' => true,
                    'servicios_horarios' => true,
                    'barberos_crm' => true,
                    'mi_marca' => true,
                    'agendar_citas' => false,
                ],
            ],
            [
                'rol' => 'Barbero',
                'identificador' => 'rol=barbero',
                'usuarios' => $totalBarberos,
                'alcance' => 'Solo sus citas asignadas',
                'permisos' => [
                    'super_admin' => false,
                    'bitacora' => false,
                    'agenda_barberia' => true,
                    'servicios_horarios' => false,
                    'barberos_crm' => false,
                    'mi_marca' => false,
                    'agendar_citas' => false,
                ],
            ],
            [
                'rol' => 'Cliente',
                'identificador' => 'rol=cliente',
                'usuarios' => $totalClientes,
                'alcance' => 'Solo sus propias reservaciones',
                'permisos' => [
                    'super_admin' => false,
                    'bitacora' => false,
                    'agenda_barberia' => false,
                    'servicios_horarios' => false,
                    'barberos_crm' => false,
                    'mi_marca' => false,
                    'agendar_citas' => true,
                ],
            ],
        ];

        $tenantsMap = Tenant::pluck('nombre', 'id');

        $cuentasAdmin = Usuario::withoutGlobalScope('tenant')
            ->where(function ($q) {
                $q->where('admin', true)
                    ->orWhere('es_barbero', true)
                    ->orWhere('rol', 'barbero');
            })
            ->orderByRaw('tenant_id IS NOT NULL')
            ->orderBy('tenant_id')
            ->orderByDesc('admin')
            ->orderBy('id')
            ->get(['id', 'tenant_id', 'nombre', 'apellido', 'email', 'admin', 'rol', 'es_barbero', 'activo'])
            ->map(fn (Usuario $u) => [
                'id' => $u->id,
                'nombre' => $u->nombre_completo,
                'email' => $u->email,
                'tipo' => $u->puedeVerBitacora()
                    ? 'Super-Admin Técnico'
                    : ($u->esAdmin() ? 'Dueño / Admin' : 'Barbero'),
                'barberia' => $u->tenant_id ? ($tenantsMap[$u->tenant_id] ?? "Tenant #{$u->tenant_id}") : 'Global (SaaS)',
                'activo' => (bool) ($u->activo ?? true),
                'es_propia' => $u->id === $usuario->id,
            ])
            ->values();

        return Inertia::render('SuperAdmin/CuentaRoles', [
            'perfil' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre ?? '',
                'apellido' => $usuario->apellido ?? '',
                'email' => $usuario->email ?? '',
                'telefono' => $usuario->telefono ?? '',
            ],
            'matrizRoles' => $matrizRoles,
            'cuentasAdmin' => $cuentasAdmin,
        ]);
    }

    public function actualizarPerfil(Request $request): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['nullable', 'string', 'max:60'],
            'email' => [
                'required',
                'email',
                'max:60',
                Rule::unique('usuarios', 'email')->ignore($usuario->id),
            ],
            'telefono' => ['nullable', 'string', 'max:25'],
            'password_nuevo' => ['nullable', 'string', 'min:6', 'confirmed'],
        ], [
            'nombre.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.unique' => 'Ese correo ya está registrado por otro usuario.',
            'password_nuevo.min' => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'password_nuevo.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
        ]);

        $cambiaPassword = ! empty($validated['password_nuevo']);

        $emailAnterior = $usuario->email;
        $usuario->nombre = trim($validated['nombre']);
        $usuario->apellido = trim((string) ($validated['apellido'] ?? ''));
        $usuario->email = strtolower(trim($validated['email']));
        $usuario->telefono = trim((string) ($validated['telefono'] ?? ''));

        if ($cambiaPassword) {
            $usuario->password = $validated['password_nuevo'];
        }

        $usuario->save();

        BitacoraService::registrar(
            modulo: 'autenticacion',
            accion: 'perfil_superadmin_actualizado',
            descripcion: "Cuenta Super-Admin actualizada ({$emailAnterior} → {$usuario->email}" . ($cambiaPassword ? ', contraseña modificada' : '') . ').',
            detalles: ['email_anterior' => $emailAnterior, 'email_nuevo' => $usuario->email, 'cambia_password' => $cambiaPassword],
            nivel: 'exito',
            entidadTipo: 'Usuario',
            entidadId: $usuario->id,
            actor: $usuario
        );

        return redirect('/super-admin/cuenta-roles')->with('exito', 'Tu cuenta de Super-Admin fue actualizada correctamente.');
    }

    public function cambiarPasswordUsuario(Request $request, int $usuarioId): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:6', 'max:100'],
        ], [
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        $target = Usuario::withoutGlobalScope('tenant')->find($usuarioId);
        if (! $target) {
            return back()->with('error', 'Usuario no encontrado.');
        }

        $target->password = $validated['password'];
        $target->confirmado = true;
        $target->token = null;
        $target->save();

        BitacoraService::registrar(
            modulo: 'autenticacion',
            accion: 'password_restablecido_superadmin',
            descripcion: "Super-Admin restableció directamente la contraseña de {$target->nombre_completo} ({$target->email}).",
            detalles: ['target_id' => $target->id, 'target_email' => $target->email, 'target_tenant_id' => $target->tenant_id],
            nivel: 'alerta',
            entidadTipo: 'Usuario',
            entidadId: $target->id
        );

        return back()->with('exito', "Contraseña actualizada correctamente para {$target->nombre_completo}.");
    }

    public function enviarResetUsuario(int $usuarioId): RedirectResponse
    {
        $target = Usuario::withoutGlobalScope('tenant')->find($usuarioId);
        if (! $target) {
            return back()->with('error', 'Usuario no encontrado.');
        }

        try {
            $target->confirmado = true;
            $target->crearToken();
            $target->save();

            $tenantNombre = $target->tenant_id
                ? Tenant::where('id', $target->tenant_id)->value('nombre')
                : null;

            Mail::to($target->email)->send(
                new ReestablecerPasswordMail($target->nombre ?: 'Usuario', $target->token, $tenantNombre)
            );

            BitacoraService::registrar(
                modulo: 'autenticacion',
                accion: 'reset_password_enviado_superadmin',
                descripcion: "Super-Admin envió correo de recuperación a {$target->email}.",
                detalles: ['target_id' => $target->id, 'target_email' => $target->email, 'tenant' => $tenantNombre],
                nivel: 'exito',
                entidadTipo: 'Usuario',
                entidadId: $target->id
            );

            return back()->with('exito', "Correo de recuperación enviado a {$target->email}.");
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo enviar el correo de recuperación: ' . $e->getMessage());
        }
    }
}
