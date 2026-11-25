<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BarberoController extends Controller
{
    public function index(): Response
    {
        $barberos = Usuario::barberos()
            ->withCount(['clientesAsignados', 'citasComoBarbero'])
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Barberos/Index', [
            'barberos' => $barberos,
        ]);
    }

    public function showCrear(): Response
    {
        return Inertia::render('Barberos/Crear');
    }

    public function crear(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenantId = $tenantContext->id();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['nullable', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'email' => [
                'required',
                'email',
                'max:60',
                Rule::unique('usuarios', 'email')->where(fn ($q) => $tenantId ? $q->where('tenant_id', $tenantId) : $q),
            ],
            'password' => ['required', 'string', 'min:6'],
            'especialidad' => ['nullable', 'string', 'max:120'],
            'admin' => ['nullable', 'boolean'],
            'activo' => ['nullable', 'boolean'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre del Barbero es Obligatorio',
            'email.required' => 'El Email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'email.unique' => 'Ya existe un usuario registrado con ese email',
            'password.required' => 'El Password inicial es Obligatorio',
            'password.min' => 'El password debe contener al menos 6 caracteres',
            'foto.image' => 'El archivo debe ser una imagen válida',
            'foto.mimes' => 'La fotografía debe ser JPG, PNG o WEBP',
            'foto.max' => 'La fotografía no debe superar 4 MB',
        ]);

        $rutaFoto = null;
        if ($request->hasFile('foto')) {
            $rutaFoto = $request->file('foto')->store($tenantContext->storagePath('barberos'), 'public');
        }

        $esAdmin = $request->boolean('admin');

        $barbero = Usuario::create([
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'] ?? '',
            'telefono' => $validated['telefono'] ?? '',
            'email' => $validated['email'],
            'password' => $validated['password'],
            'admin' => $esAdmin,
            'rol' => $esAdmin ? 'admin' : 'barbero',
            'es_barbero' => true,
            'especialidad' => $validated['especialidad'] ?? null,
            'foto' => $rutaFoto,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'confirmado' => true,
            'token' => null,
        ]);

        BitacoraService::registrar(
            modulo: 'barberos',
            accion: 'barbero_creado',
            descripcion: "Barbero '{$barbero->nombre_completo}' registrado ({$barbero->rol}).",
            detalles: ['email' => $barbero->email, 'rol' => $barbero->rol, 'telefono' => $barbero->telefono],
            nivel: 'exito',
            entidadTipo: 'Usuario',
            entidadId: $barbero->id
        );

        return redirect('/barberos')->with('exito', 'Barbero registrado correctamente');
    }

    public function showActualizar(Request $request): Response|RedirectResponse
    {
        $id = $request->query('id');

        if (! is_numeric($id)) {
            return redirect('/barberos');
        }

        $barbero = Usuario::barberos()->find((int) $id);

        if (! $barbero) {
            return redirect('/barberos');
        }

        return Inertia::render('Barberos/Actualizar', [
            'barbero' => $barbero,
        ]);
    }

    public function actualizar(Request $request): RedirectResponse
    {
        $id = $request->query('id') ?? $request->input('id');

        if (! is_numeric($id)) {
            return redirect('/barberos');
        }

        $barbero = Usuario::barberos()->find((int) $id);

        if (! $barbero) {
            return redirect('/barberos');
        }

        $tenantId = app(TenantContext::class)->id();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['nullable', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'email' => [
                'required',
                'email',
                'max:60',
                Rule::unique('usuarios', 'email')
                    ->where(fn ($q) => $tenantId ? $q->where('tenant_id', $tenantId) : $q)
                    ->ignore($barbero->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
            'especialidad' => ['nullable', 'string', 'max:120'],
            'admin' => ['nullable', 'boolean'],
            'activo' => ['nullable', 'boolean'],
            'eliminar_foto' => ['nullable', 'boolean'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre del Barbero es Obligatorio',
            'email.required' => 'El Email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'email.unique' => 'Ya existe otro usuario registrado con ese email',
            'password.min' => 'El password debe contener al menos 6 caracteres',
            'foto.image' => 'El archivo debe ser una imagen válida',
            'foto.mimes' => 'La fotografía debe ser JPG, PNG o WEBP',
            'foto.max' => 'La fotografía no debe superar 4 MB',
        ]);

        $rutaFoto = $barbero->foto;

        if ($request->boolean('eliminar_foto') && $rutaFoto) {
            Storage::disk('public')->delete($rutaFoto);
            $rutaFoto = null;
        }

        if ($request->hasFile('foto')) {
            if ($rutaFoto) {
                Storage::disk('public')->delete($rutaFoto);
            }
            $rutaFoto = $request->file('foto')->store(app(TenantContext::class)->storagePath('barberos'), 'public');
        }

        $esAdmin = $request->has('admin') ? $request->boolean('admin') : (bool) $barbero->admin;

        $datos = [
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'] ?? '',
            'telefono' => $validated['telefono'] ?? '',
            'email' => $validated['email'],
            'admin' => $esAdmin,
            'rol' => $esAdmin ? 'admin' : 'barbero',
            'es_barbero' => true,
            'especialidad' => $validated['especialidad'] ?? null,
            'foto' => $rutaFoto,
            'activo' => $request->has('activo') ? $request->boolean('activo') : $barbero->activo,
        ];

        if (! empty($validated['password'])) {
            $datos['password'] = $validated['password'];
        }

        $barbero->update($datos);

        BitacoraService::registrar(
            modulo: 'barberos',
            accion: 'barbero_actualizado',
            descripcion: "Perfil de barbero '{$barbero->nombre_completo}' actualizado.",
            detalles: ['email' => $barbero->email, 'rol' => $barbero->rol, 'activo' => (bool) $barbero->activo],
            nivel: 'info',
            entidadTipo: 'Usuario',
            entidadId: $barbero->id
        );

        return redirect('/barberos')->with('exito', 'Barbero actualizado correctamente');
    }

    public function toggleActivo(Request $request): RedirectResponse
    {
        $id = $request->input('id');

        if (is_numeric($id)) {
            $barbero = Usuario::barberos()->find((int) $id);
            if ($barbero) {
                $barbero->activo = ! $barbero->activo;
                $barbero->save();

                BitacoraService::registrar(
                    modulo: 'barberos',
                    accion: 'barbero_estado_cambiado',
                    descripcion: "Barbero '{$barbero->nombre_completo}' marcado como " . ($barbero->activo ? 'activo' : 'inactivo') . '.',
                    detalles: ['activo' => (bool) $barbero->activo],
                    nivel: 'alerta',
                    entidadTipo: 'Usuario',
                    entidadId: $barbero->id
                );
            }
        }

        return back();
    }
}
