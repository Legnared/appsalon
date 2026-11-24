<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use App\Services\BitacoraService;
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

        $servicio = Servicio::create([
            'nombre' => $validated['nombre'],
            'precio' => $validated['precio'],
            'descripcion' => $validated['descripcion'] ?? null,
            'duracion_minutos' => $validated['duracion_minutos'] ?? 30,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'tipos_rostro' => $validated['tipos_rostro'] ?? [],
            'recomendacion_rostro' => $validated['recomendacion_rostro'] ?? null,
            'imagen' => $rutaImagen,
        ]);

        BitacoraService::registrar(
            modulo: 'servicios',
            accion: 'servicio_creado',
            descripcion: "Servicio '{$servicio->nombre}' creado con precio \${$servicio->precio} MXN.",
            detalles: ['nombre' => $servicio->nombre, 'precio' => (float) $servicio->precio, 'activo' => (bool) $servicio->activo],
            nivel: 'exito',
            entidadTipo: 'Servicio',
            entidadId: $servicio->id
        );

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

        BitacoraService::registrar(
            modulo: 'servicios',
            accion: 'servicio_actualizado',
            descripcion: "Servicio '{$servicio->nombre}' actualizado (\${$servicio->precio} MXN).",
            detalles: ['nombre' => $servicio->nombre, 'precio' => (float) $servicio->precio, 'activo' => (bool) $servicio->activo],
            nivel: 'info',
            entidadTipo: 'Servicio',
            entidadId: $servicio->id
        );

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

                BitacoraService::registrar(
                    modulo: 'servicios',
                    accion: 'servicio_estado_cambiado',
                    descripcion: "Servicio '{$servicio->nombre}' marcado como " . ($servicio->activo ? 'activo' : 'inactivo') . '.',
                    detalles: ['activo' => (bool) $servicio->activo],
                    nivel: 'info',
                    entidadTipo: 'Servicio',
                    entidadId: $servicio->id
                );
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
                $nombreEliminado = $servicio->nombre;
                $idEliminado = $servicio->id;
                if ($servicio->imagen) {
                    Storage::disk('public')->delete($servicio->imagen);
                }
                $servicio->delete();

                BitacoraService::registrar(
                    modulo: 'servicios',
                    accion: 'servicio_eliminado',
                    descripcion: "Servicio '{$nombreEliminado}' (#{$idEliminado}) fue eliminado del catálogo.",
                    detalles: ['servicio_id' => $idEliminado, 'nombre' => $nombreEliminado],
                    nivel: 'alerta',
                    entidadTipo: 'Servicio',
                    entidadId: $idEliminado
                );
            }
        }

        return redirect('/servicios')->with('exito', 'Servicio eliminado correctamente');
    }
}
