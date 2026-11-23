<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServicioController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Servicios/Index', [
            'servicios' => Servicio::orderBy('id')->get(),
        ]);
    }

    public function showCrear(): Response
    {
        return Inertia::render('Servicios/Crear');
    }

    public function crear(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'precio' => ['required', 'numeric'],
        ], [
            'nombre.required' => 'El Nombre del Servicio es Obligatorio',
            'precio.required' => 'El Precio del Servicio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
        ]);

        Servicio::create($validated);

        return redirect('/servicios')->with('exito', 'Servicio creado correctamente');
    }

    public function showActualizar(Request $request): Response|RedirectResponse
    {
        $id = $request->query('id');

        if (! is_numeric($id)) {
            return redirect('/servicios');
        }

        $servicio = Servicio::find((int) $id);

        if (! $servicio) {
            return redirect('/servicios');
        }

        return Inertia::render('Servicios/Actualizar', [
            'servicio' => $servicio,
        ]);
    }

    public function actualizar(Request $request): RedirectResponse
    {
        $id = $request->query('id') ?? $request->input('id');

        if (! is_numeric($id)) {
            return redirect('/servicios');
        }

        $servicio = Servicio::find((int) $id);

        if (! $servicio) {
            return redirect('/servicios');
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'precio' => ['required', 'numeric'],
        ], [
            'nombre.required' => 'El Nombre del Servicio es Obligatorio',
            'precio.required' => 'El Precio del Servicio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
        ]);

        $servicio->update($validated);

        return redirect('/servicios')->with('exito', 'Servicio actualizado correctamente');
    }

    public function eliminar(Request $request): RedirectResponse
    {
        $id = $request->input('id');

        if (is_numeric($id)) {
            $servicio = Servicio::find((int) $id);
            if ($servicio) {
                $servicio->delete();
            }
        }

        return redirect('/servicios');
    }
}
