<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClienteController extends Controller
{
    public function index(Request $request): Response
    {
        $barberoFiltro = (string) $request->query('barbero_id', 'todos');

        $query = Usuario::clientes()
            ->with(['barberoAsignado:id,nombre,apellido'])
            ->withCount('citas')
            ->orderByDesc('id');

        if ($barberoFiltro === 'sin_asignar') {
            $query->whereNull('barbero_id');
        } elseif (is_numeric($barberoFiltro)) {
            $query->where('barbero_id', (int) $barberoFiltro);
        }

        $clientes = $query->get()->map(fn (Usuario $cliente) => [
            'id' => $cliente->id,
            'nombre' => $cliente->nombre,
            'apellido' => $cliente->apellido,
            'nombre_completo' => $cliente->nombre_completo,
            'email' => $cliente->email,
            'telefono' => $cliente->telefono,
            'confirmado' => (bool) $cliente->confirmado,
            'barbero_id' => $cliente->barbero_id,
            'barbero_nombre' => $cliente->barberoAsignado?->nombre_completo,
            'citas_count' => $cliente->citas_count ?? 0,
        ])->values();

        $barberos = Usuario::barberos()
            ->orderByDesc('activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido', 'activo']);

        return Inertia::render('Clientes/Index', [
            'clientes' => $clientes,
            'barberos' => $barberos,
            'barberoFiltro' => $barberoFiltro,
        ]);
    }

    public function showCrear(): Response
    {
        return Inertia::render('Clientes/Crear', [
            'barberos' => Usuario::barberos()
                ->where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'apellido', 'especialidad']),
        ]);
    }

    public function crear(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['required', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:10'],
            'email' => ['required', 'email', 'max:60', 'unique:usuarios,email'],
            'password' => ['nullable', 'string', 'min:6'],
            'barbero_id' => ['nullable', 'integer', 'exists:usuarios,id'],
            'confirmado' => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El Nombre del Cliente es Obligatorio',
            'apellido.required' => 'El Apellido del Cliente es Obligatorio',
            'email.required' => 'El Email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'email.unique' => 'Ya existe un usuario registrado con ese email',
            'password.min' => 'El password debe contener al menos 6 caracteres',
        ]);

        $password = ! empty($validated['password'])
            ? $validated['password']
            : Str::random(10);

        Usuario::create([
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'],
            'telefono' => $validated['telefono'] ?? '',
            'email' => $validated['email'],
            'password' => $password,
            'admin' => false,
            'rol' => 'cliente',
            'activo' => true,
            'barbero_id' => ! empty($validated['barbero_id']) ? (int) $validated['barbero_id'] : null,
            'confirmado' => $request->has('confirmado') ? $request->boolean('confirmado') : true,
            'token' => null,
        ]);

        return redirect('/clientes')->with('exito', 'Cliente / prospecto registrado correctamente');
    }

    public function showActualizar(Request $request): Response|RedirectResponse
    {
        $id = $request->query('id');

        if (! is_numeric($id)) {
            return redirect('/clientes');
        }

        $cliente = Usuario::clientes()->find((int) $id);

        if (! $cliente) {
            return redirect('/clientes');
        }

        return Inertia::render('Clientes/Actualizar', [
            'cliente' => $cliente,
            'barberos' => Usuario::barberos()
                ->orderByDesc('activo')
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'apellido', 'especialidad', 'activo']),
        ]);
    }

    public function actualizar(Request $request): RedirectResponse
    {
        $id = $request->query('id') ?? $request->input('id');

        if (! is_numeric($id)) {
            return redirect('/clientes');
        }

        $cliente = Usuario::clientes()->find((int) $id);

        if (! $cliente) {
            return redirect('/clientes');
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['required', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:10'],
            'email' => ['required', 'email', 'max:60', 'unique:usuarios,email,' . $cliente->id],
            'password' => ['nullable', 'string', 'min:6'],
            'barbero_id' => ['nullable', 'integer', 'exists:usuarios,id'],
            'confirmado' => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El Nombre del Cliente es Obligatorio',
            'apellido.required' => 'El Apellido del Cliente es Obligatorio',
            'email.required' => 'El Email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'email.unique' => 'Ya existe otro usuario registrado con ese email',
            'password.min' => 'El password debe contener al menos 6 caracteres',
        ]);

        $datos = [
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'],
            'telefono' => $validated['telefono'] ?? '',
            'email' => $validated['email'],
            'barbero_id' => ! empty($validated['barbero_id']) ? (int) $validated['barbero_id'] : null,
            'confirmado' => $request->has('confirmado') ? $request->boolean('confirmado') : $cliente->confirmado,
        ];

        if (! empty($validated['password'])) {
            $datos['password'] = $validated['password'];
        }

        $cliente->update($datos);

        return redirect('/clientes')->with('exito', 'Cliente actualizado correctamente');
    }
}
