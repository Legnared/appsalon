<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\CitaServicio;
use App\Models\Servicio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class APIController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Servicio::orderBy('id')->get());
    }

    public function guardar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fecha' => ['required', 'date'],
            'hora' => ['required', 'string'],
            'servicios' => ['required'],
        ], [
            'fecha.required' => 'La fecha es obligatoria',
            'hora.required' => 'La hora es obligatoria',
            'servicios.required' => 'Debes seleccionar al menos un servicio',
        ]);

        $rawServicios = $request->input('servicios');
        $idServicios = is_array($rawServicios)
            ? array_values(array_filter($rawServicios))
            : array_values(array_filter(explode(',', (string) $rawServicios)));

        if (count($idServicios) === 0) {
            return response()->json([
                'resultado' => false,
                'mensaje' => 'Debes seleccionar al menos un servicio',
            ], 422);
        }

        $usuarioId = $request->user()?->id ?? $request->input('usuarioId');

        $cita = DB::transaction(function () use ($validated, $usuarioId, $idServicios) {
            $cita = Cita::create([
                'fecha' => $validated['fecha'],
                'hora' => $validated['hora'],
                'usuarioId' => $usuarioId,
            ]);

            foreach ($idServicios as $idServicio) {
                CitaServicio::create([
                    'citaId' => $cita->id,
                    'servicioId' => (int) $idServicio,
                ]);
            }

            return $cita;
        });

        return response()->json([
            'resultado' => [
                'resultado' => true,
                'id' => $cita->id,
            ],
            'id' => $cita->id,
        ]);
    }

    public function eliminar(Request $request): RedirectResponse
    {
        $id = $request->input('id');

        if ($id) {
            $cita = Cita::find($id);
            if ($cita) {
                $cita->delete();
            }
        }

        return back();
    }
}
