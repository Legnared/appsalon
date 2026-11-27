<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use App\Services\BitacoraService;
use App\Services\TenantContext;
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

    public function showCrear(Request $request): Response
    {
        return Inertia::render('Servicios/Crear', [
            'tipoInicial' => $request->query('tipo') === 'producto' ? 'producto' : 'servicio',
        ]);
    }

    public function crear(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tipo' => ['nullable', 'in:servicio,producto'],
            'nombre' => ['required', 'string', 'max:60'],
            'precio' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'duracion_minutos' => ['nullable', 'integer', 'min:0', 'max:480'],
            'stock' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'activo' => ['nullable', 'boolean'],
            'tipos_rostro' => ['nullable', 'array'],
            'tipos_rostro.*' => ['string', 'in:redondo,ovalado,cuadrado,alargado,diamante'],
            'recomendacion_rostro' => ['nullable', 'string', 'max:255'],
            'imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre es Obligatorio',
            'precio.required' => 'El Precio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
            'imagen.image' => 'El archivo debe ser una imagen válida',
            'imagen.mimes' => 'La imagen debe ser JPG, PNG o WEBP',
            'imagen.max' => 'La imagen no debe superar 4 MB',
        ]);

        $tipo = $validated['tipo'] ?? 'servicio';
        $esProducto = $tipo === 'producto';

        $rutaImagen = null;
        if ($request->hasFile('imagen')) {
            $rutaImagen = $request->file('imagen')->store(app(TenantContext::class)->storagePath('servicios'), 'public');
        }

        $servicio = Servicio::create([
            'tipo' => $tipo,
            'nombre' => $validated['nombre'],
            'precio' => $validated['precio'],
            'descripcion' => $validated['descripcion'] ?? null,
            'duracion_minutos' => $esProducto ? 0 : ($validated['duracion_minutos'] ?? 30),
            'stock' => $esProducto && $request->filled('stock') ? (int) $validated['stock'] : null,
            'activo' => $request->has('activo') ? $request->boolean('activo') : true,
            'tipos_rostro' => $esProducto ? [] : ($validated['tipos_rostro'] ?? []),
            'recomendacion_rostro' => $esProducto ? null : ($validated['recomendacion_rostro'] ?? null),
            'imagen' => $rutaImagen,
        ]);

        $etiqueta = $esProducto ? 'Producto' : 'Servicio';

        BitacoraService::registrar(
            modulo: 'servicios',
            accion: $esProducto ? 'producto_creado' : 'servicio_creado',
            descripcion: "{$etiqueta} '{$servicio->nombre}' creado con precio \${$servicio->precio} MXN.",
            detalles: ['tipo' => $tipo, 'nombre' => $servicio->nombre, 'precio' => (float) $servicio->precio, 'stock' => $servicio->stock, 'activo' => (bool) $servicio->activo],
            nivel: 'exito',
            entidadTipo: 'Servicio',
            entidadId: $servicio->id
        );

        return redirect('/servicios')->with('exito', "{$etiqueta} creado correctamente");
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
            'tipo' => ['nullable', 'in:servicio,producto'],
            'nombre' => ['required', 'string', 'max:60'],
            'precio' => ['required', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'duracion_minutos' => ['nullable', 'integer', 'min:0', 'max:480'],
            'stock' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'activo' => ['nullable', 'boolean'],
            'tipos_rostro' => ['nullable', 'array'],
            'tipos_rostro.*' => ['string', 'in:redondo,ovalado,cuadrado,alargado,diamante'],
            'recomendacion_rostro' => ['nullable', 'string', 'max:255'],
            'eliminar_imagen' => ['nullable', 'boolean'],
            'imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'nombre.required' => 'El Nombre es Obligatorio',
            'precio.required' => 'El Precio es Obligatorio',
            'precio.numeric' => 'El precio no es válido',
            'imagen.image' => 'El archivo debe ser una imagen válida',
            'imagen.mimes' => 'La imagen debe ser JPG, PNG o WEBP',
            'imagen.max' => 'La imagen no debe superar 4 MB',
        ]);

        $tipo = $validated['tipo'] ?? ($servicio->tipo ?: 'servicio');
        $esProducto = $tipo === 'producto';

        $rutaImagen = $servicio->imagen;

        if ($request->boolean('eliminar_imagen') && $rutaImagen) {
            Storage::disk('public')->delete($rutaImagen);
            $rutaImagen = null;
        }

        if ($request->hasFile('imagen')) {
            if ($rutaImagen) {
                Storage::disk('public')->delete($rutaImagen);
            }
            $rutaImagen = $request->file('imagen')->store(app(TenantContext::class)->storagePath('servicios'), 'public');
        }

        $servicio->update([
            'tipo' => $tipo,
            'nombre' => $validated['nombre'],
            'precio' => $validated['precio'],
            'descripcion' => $validated['descripcion'] ?? null,
            'duracion_minutos' => $esProducto ? 0 : ($validated['duracion_minutos'] ?? 30),
            'stock' => $esProducto && $request->filled('stock') ? (int) $validated['stock'] : null,
            'activo' => $request->has('activo') ? $request->boolean('activo') : $servicio->activo,
            'tipos_rostro' => $esProducto ? [] : ($validated['tipos_rostro'] ?? []),
            'recomendacion_rostro' => $esProducto ? null : ($validated['recomendacion_rostro'] ?? null),
            'imagen' => $rutaImagen,
        ]);

        $etiqueta = $esProducto ? 'Producto' : 'Servicio';

        BitacoraService::registrar(
            modulo: 'servicios',
            accion: $esProducto ? 'producto_actualizado' : 'servicio_actualizado',
            descripcion: "{$etiqueta} '{$servicio->nombre}' actualizado (\${$servicio->precio} MXN).",
            detalles: ['tipo' => $tipo, 'nombre' => $servicio->nombre, 'precio' => (float) $servicio->precio, 'stock' => $servicio->stock, 'activo' => (bool) $servicio->activo],
            nivel: 'info',
            entidadTipo: 'Servicio',
            entidadId: $servicio->id
        );

        return redirect('/servicios')->with('exito', "{$etiqueta} actualizado correctamente");
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
