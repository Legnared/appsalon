<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();

        return Inertia::render('Perfil/Index', [
            'perfil' => [
                'id' => $usuario->id,
                'nombre' => $usuario->nombre ?? '',
                'apellido' => $usuario->apellido ?? '',
                'email' => $usuario->email ?? '',
                'telefono' => $usuario->telefono ?? '',
                'especialidad' => $usuario->especialidad ?? '',
                'es_barbero' => (bool) $usuario->es_barbero,
                'foto_url' => $usuario->foto_url,
            ],
        ]);
    }

    public function actualizar(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        /** @var Usuario $usuario */
        $usuario = $request->user();
        $tenantId = $usuario->tenant_id ?? $tenantContext->id();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['nullable', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'especialidad' => ['nullable', 'string', 'max:120'],
            'email' => [
                'required',
                'email',
                'max:60',
                Rule::unique('usuarios', 'email')
                    ->where(fn ($q) => $tenantId ? $q->where('tenant_id', $tenantId) : $q->whereNull('tenant_id'))
                    ->ignore($usuario->id),
            ],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'eliminar_foto' => ['nullable', 'boolean'],
            'password_nuevo' => ['nullable', 'string', 'min:6', 'confirmed'],
        ], [
            'nombre.required' => 'Tu nombre es obligatorio.',
            'email.required' => 'Tu correo electrónico es obligatorio.',
            'email.unique' => 'Ese correo ya está en uso por otra cuenta.',
            'foto.image' => 'La fotografía debe ser una imagen válida (JPG, PNG o WEBP).',
            'foto.max' => 'La fotografía no debe superar 4 MB.',
            'password_nuevo.min' => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'password_nuevo.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
        ]);

        $cambiaPassword = ! empty($validated['password_nuevo']);

        $rutaFoto = $usuario->foto;
        if ($request->boolean('eliminar_foto') && $rutaFoto) {
            Storage::disk('public')->delete($rutaFoto);
            $rutaFoto = null;
        } elseif ($request->hasFile('foto')) {
            if ($rutaFoto) {
                Storage::disk('public')->delete($rutaFoto);
            }
            $rutaFoto = $request->file('foto')->store($tenantContext->storagePath('barberos'), 'public');
        }

        $usuario->nombre = trim($validated['nombre']);
        $usuario->apellido = trim((string) ($validated['apellido'] ?? ''));
        $usuario->telefono = trim((string) ($validated['telefono'] ?? ''));
        $usuario->email = strtolower(trim($validated['email']));
        $usuario->foto = $rutaFoto;

        if ($usuario->esBarbero()) {
            $usuario->especialidad = trim((string) ($validated['especialidad'] ?? '')) ?: null;
        }

        if ($cambiaPassword) {
            $usuario->password = $validated['password_nuevo'];
        }

        $usuario->save();

        BitacoraService::registrar(
            modulo: 'autenticacion',
            accion: 'mi_perfil_actualizado',
            descripcion: "{$usuario->nombre_completo} actualizó su perfil" . ($cambiaPassword ? ' y contraseña.' : '.'),
            detalles: ['email' => $usuario->email, 'cambia_password' => $cambiaPassword],
            nivel: 'exito',
            entidadTipo: 'Usuario',
            entidadId: $usuario->id,
            actor: $usuario
        );

        return redirect('/mi-perfil')->with('exito', 'Tu perfil y contraseña se actualizaron correctamente.');
    }
}
