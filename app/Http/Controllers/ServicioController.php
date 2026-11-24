<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'precio' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'duracion_minutos' => ['nullable', 'integer', 'min:5', 'max:480'],
            'activo' => ['nullable', 'boolean'],
            'tipos_rostro' => ['nullable', 'array'],
            'tipos_rostro.*' => ['string', 'in:redondo,ovalado,cuadrado,alargado,diamante'],
            'recomendacion_rostro' => ['nullable', 'string', 'max:255'],
            'imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre del Servicio es Obligatorio',
            'precio.required' => 'El Precio del Servicio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
            'imagen.image' => 'El archivo debe ser una imagen válida',
            'imagen.mimes' => 'La imagen debe ser JPG, PNG o WEBP',
            'imagen.max' => 'La imagen no debe superar 4 MB',
        ]);

        $rutaImagen = null;
        if ($request->hasFile('imagen')) {
            $rutaImagen = $request->file('imagen')->store('servicios', 'public');
        }

        Servicio::create([
            'nombre' => $validated['nombre'],
            'precio' => $validated['precio'],
            'descripcion' => $validated['descripcion'] ?? null,
            'duracion_minutos' => $validated['duracion_minutos'] ?? 30,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'tipos_rostro' => $validated['tipos_rostro'] ?? [],
            'recomendacion_rostro' => $validated['recomendacion_rostro'] ?? null,
            'imagen' => $rutaImagen,
        ]);

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
            'precio' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'duracion_minutos' => ['nullable', 'integer', 'min:5', 'max:480'],
            'activo' => ['nullable', 'boolean'],
            'tipos_rostro' => ['nullable', 'array'],
            'tipos_rostro.*' => ['string', 'in:redondo,ovalado,cuadrado,alargado,diamante'],
            'recomendacion_rostro' => ['nullable', 'string', 'max:255'],
            'eliminar_imagen' => ['nullable', 'boolean'],
            'imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre del Servicio es Obligatorio',
            'precio.required' => 'El Precio del Servicio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
            'imagen.image' => 'El archivo debe ser una imagen válida',
            'imagen.mimes' => 'La imagen debe ser JPG, PNG o WEBP',
            'imagen.max' => 'La imagen no debe superar 4 MB',
        ]);

        $rutaImagen = $servicio->imagen;

        if ($request->boolean('eliminar_imagen') && $rutaImagen) {
            Storage::disk('public')->delete($rutaImagen);
            $rutaImagen = null;
        }

        if ($request->hasFile('imagen')) {
            if ($rutaImagen) {
                Storage::disk('public')->delete($rutaImagen);
            }
            $rutaImagen = $request->file('imagen')->store('servicios', 'public');
        }

        $servicio->update([
            'nombre' => $validated['nombre'],
            'precio' => $validated['precio'],
            'descripcion' => $validated['descripcion'] ?? null,
            'duracion_minutos' => $validated['duracion_minutos'] ?? 30,
            'activo' => $request->has('activo') ? $request->boolean('activo') : $servicio->activo,
            'tipos_rostro' => $validated['tipos_rostro'] ?? [],
            'recomendacion_rostro' => $validated['recomendacion_rostro'] ?? null,
            'imagen' => $rutaImagen,
        ]);

        return redirect('/servicios')->with('exito', 'Servicio actualizado correctamente');
    }

    public function toggleActivo(Request $request): RedirectResponse
    {
        $id = $request->input('id');

        if (is_numeric($id)) {
            $servicio = Servicio::find((int) $id);
            if ($servicio) {
                $servicio->activo = ! $servicio->activo;
                $servicio->save();
            }
        }

        return back();
    }

    public function eliminar(Request $request): RedirectResponse
    {
        $id = $request->input('id');

        if (is_numeric($id)) {
            $servicio = Servicio::find((int) $id);
            if ($servicio) {
                if ($servicio->imagen) {
                    Storage::disk('public')->delete($servicio->imagen);
                }
                $servicio->delete();
            }
        }

        return redirect('/servicios')->with('exito', 'Servicio eliminado correctamente');
    }
}
