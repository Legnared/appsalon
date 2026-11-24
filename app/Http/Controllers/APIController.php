<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\CitaServicio;
use App\Models\HorarioLaboral;
use App\Models\Pago;
use App\Models\Servicio;
use App\Models\Usuario;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class APIController extends Controller
{
    private const MINUTOS_EMPALME = 60;

    public function index(): JsonResponse
    {
        return response()->json(Servicio::where('activo', true)->orderBy('id')->get());
    }

    public function disponibilidad(Request $request): JsonResponse
    {
        $fecha = (string) $request->query('fecha', '');
        $barberoId = $request->query('barbero_id');

        if ($fecha === '' || ! strtotime($fecha)) {
            return response()->json([
                'abierto' => true,
                'intervalo_minutos' => 60,
                'slots' => [],
            ]);
        }

        $diaSemana = (int) date('w', strtotime($fecha));
        $configDia = HorarioLaboral::porDia($diaSemana);

        if (! $configDia['abierto']) {
            return response()->json([
                'fecha' => $fecha,
                'abierto' => false,
                'nombre_dia' => $configDia['nombre_dia'],
                'intervalo_minutos' => $configDia['intervalo_minutos'],
                'slots' => [],
            ]);
        }

        $aperturaMin = $this->horaAMinutos($configDia['hora_apertura']) ?? 600;
        $cierreMin = $this->horaAMinutos($configDia['hora_cierre']) ?? 1140;
        $intervalo = max(15, (int) ($configDia['intervalo_minutos'] ?? 60));

        $horariosBase = [];
        for ($m = $aperturaMin; $m <= $cierreMin; $m += $intervalo) {
            $horariosBase[] = sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
        }

        $query = Cita::where('fecha', $fecha);
        if (is_numeric($barberoId)) {
            $query->where('barberoId', (int) $barberoId);
        }

        $horasOcupadasMin = $query->pluck('hora')
            ->map(fn ($hora) => $this->horaAMinutos((string) $hora))
            ->filter(fn ($m) => $m !== null)
            ->values()
            ->all();

        $slots = array_map(function (string $horaSlot) use ($horasOcupadasMin, $intervalo) {
            $slotMin = $this->horaAMinutos($horaSlot);
            $ocupado = false;

            foreach ($horasOcupadasMin as $ocupadaMin) {
                if (abs($slotMin - $ocupadaMin) < $intervalo) {
                    $ocupado = true;
                    break;
                }
            }

            return [
                'hora' => $horaSlot,
                'disponible' => ! $ocupado,
            ];
        }, $horariosBase);

        return response()->json([
            'fecha' => $fecha,
            'abierto' => true,
            'nombre_dia' => $configDia['nombre_dia'],
            'hora_apertura' => $configDia['hora_apertura'],
            'hora_cierre' => $configDia['hora_cierre'],
            'intervalo_minutos' => $intervalo,
            'barbero_id' => is_numeric($barberoId) ? (int) $barberoId : null,
            'slots' => $slots,
        ]);
    }

    public function guardar(Request $request, PaymentManager $payments): JsonResponse
    {
        $validated = $request->validate([
            'fecha' => ['required', 'date'],
            'hora' => ['required', 'string'],
            'barberoId' => ['nullable', 'integer', 'exists:usuarios,id'],
            'para_quien' => ['nullable', 'in:titular,hijo,familiar'],
            'nombre_beneficiario' => ['required_if:para_quien,hijo,familiar', 'nullable', 'string', 'max:80'],
            'servicios' => ['required'],
            'metodo_pago' => ['nullable', 'in:tarjeta_online,terminal_pos'],
            'tarjeta_titular' => ['required_if:metodo_pago,tarjeta_online', 'nullable', 'string', 'max:100'],
            'tarjeta_numero' => ['required_if:metodo_pago,tarjeta_online', 'nullable', 'string', 'min:15', 'max:25'],
            'tarjeta_expiracion' => ['required_if:metodo_pago,tarjeta_online', 'nullable', 'string', 'max:7'],
            'tarjeta_cvv' => ['required_if:metodo_pago,tarjeta_online', 'nullable', 'string', 'min:3', 'max:4'],
            'terminal_modo' => ['nullable', 'in:en_sucursal,enviar_terminal'],
        ], [
            'fecha.required' => 'La fecha es obligatoria',
            'hora.required' => 'La hora es obligatoria',
            'servicios.required' => 'Debes seleccionar al menos un servicio',
            'nombre_beneficiario.required_if' => 'Indica el nombre de tu hijo o familiar para esta cita',
            'tarjeta_titular.required_if' => 'El nombre del titular de la tarjeta es obligatorio',
            'tarjeta_numero.required_if' => 'El número de tarjeta es obligatorio',
            'tarjeta_expiracion.required_if' => 'La fecha de expiración es obligatoria',
            'tarjeta_cvv.required_if' => 'El código CVV es obligatorio',
        ]);

        $barberoId = ! empty($validated['barberoId']) ? (int) $validated['barberoId'] : null;

        // Validar horario laboral configurado por el administrador
        $diaSemana = (int) date('w', strtotime($validated['fecha']));
        $configDia = HorarioLaboral::porDia($diaSemana);
        if (! $configDia['abierto']) {
            return response()->json([
                'resultado' => false,
                'mensaje' => "Los días {$configDia['nombre_dia']} no laboramos. Por favor elige otro día.",
            ], 422);
        }

        $intervaloDia = max(15, (int) ($configDia['intervalo_minutos'] ?? self::MINUTOS_EMPALME));

        // Validar empalme para el barbero seleccionado según el intervalo del día
        if ($this->hayEmpalme($validated['fecha'], $validated['hora'], $barberoId, null, $intervaloDia)) {
            return response()->json([
                'resultado' => false,
                'mensaje' => "Ese horario ya está ocupado con el barbero seleccionado (se requieren al menos {$intervaloDia} minutos entre citas). Elige otro horario u otro barbero.",
            ], 422);
        }

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

        $serviciosDb = Servicio::whereIn('id', array_map('intval', $idServicios))->get();
        if ($serviciosDb->isEmpty()) {
            return response()->json([
                'resultado' => false,
                'mensaje' => 'Los servicios seleccionados no son válidos',
            ], 422);
        }

        $montoTotal = (float) $serviciosDb->sum('precio');
        $moneda = (string) config('payments.currency', 'MXN');
        $metodoPago = $validated['metodo_pago'] ?? 'terminal_pos';
        $usuario = $request->user();
        $usuarioId = $usuario?->id ?? $request->input('usuarioId');

        $gateway = $payments->driver();

        $resultadoTransaccion = DB::transaction(function () use (
            $validated,
            $usuarioId,
            $usuario,
            $barberoId,
            $serviciosDb,
            $montoTotal,
            $moneda,
            $metodoPago,
            $gateway
        ) {
            $paraQuien = $validated['para_quien'] ?? 'titular';
            $nombreBeneficiario = $paraQuien === 'titular'
                ? null
                : trim((string) ($validated['nombre_beneficiario'] ?? ''));

            $cita = Cita::create([
                'fecha' => $validated['fecha'],
                'hora' => $validated['hora'],
                'usuarioId' => $usuarioId,
                'barberoId' => $barberoId,
                'para_quien' => $paraQuien,
                'nombre_beneficiario' => $nombreBeneficiario !== '' ? $nombreBeneficiario : null,
            ]);

            if ($usuario && ! $usuario->barbero_id && $barberoId) {
                $usuario->barbero_id = $barberoId;
                $usuario->save();
            }

            foreach ($serviciosDb as $servicio) {
                CitaServicio::create([
                    'citaId' => $cita->id,
                    'servicioId' => $servicio->id,
                ]);
            }

            if ($metodoPago === 'tarjeta_online') {
                $paymentResult = $gateway->chargeCard(
                    $cita,
                    new CardPaymentRequestData(
                        monto: $montoTotal,
                        moneda: $moneda,
                        titular: (string) $validated['tarjeta_titular'],
                        numeroTarjeta: (string) $validated['tarjeta_numero'],
                        expiracion: (string) $validated['tarjeta_expiracion'],
                        cvv: (string) $validated['tarjeta_cvv'],
                        emailCliente: $usuario?->email,
                    )
                );
            } else {
                $paymentResult = $gateway->initiateTerminalPayment(
                    $cita,
                    new TerminalPaymentRequestData(
                        monto: $montoTotal,
                        moneda: $moneda,
                        modo: $validated['terminal_modo'] ?? 'en_sucursal',
                    )
                );
            }

            $pago = Pago::create([
                'citaId' => $cita->id,
                'usuarioId' => $usuarioId,
                'monto' => $montoTotal,
                'moneda' => $moneda,
                'metodo' => $metodoPago,
                'gateway' => $paymentResult->gateway,
                'estado' => $paymentResult->estado,
                'referencia_bancaria' => $paymentResult->referenciaBancaria,
                'codigo_autorizacion' => $paymentResult->codigoAutorizacion,
                'ultimos_4' => $paymentResult->ultimos4,
                'marca_tarjeta' => $paymentResult->marcaTarjeta,
                'terminal_id' => $paymentResult->terminalId,
                'respuesta_payload' => $paymentResult->payload,
                'pagado_en' => $paymentResult->estado === 'pagado' ? now() : null,
            ]);

            return [
                'cita' => $cita,
                'pago' => $pago,
                'paymentResult' => $paymentResult,
            ];
        });

        /** @var \App\Services\Payments\DTOs\PaymentResultData $paymentResult */
        $paymentResult = $resultadoTransaccion['paymentResult'];
        /** @var Cita $cita */
        $cita = $resultadoTransaccion['cita'];
        /** @var Pago $pago */
        $pago = $resultadoTransaccion['pago'];

        if ($metodoPago === 'tarjeta_online' && ! $paymentResult->aprobado) {
            return response()->json([
                'resultado' => false,
                'mensaje' => $paymentResult->mensaje ?? 'El pago con tarjeta fue rechazado por el banco',
                'pago' => [
                    'id' => $pago->id,
                    'estado' => $pago->estado,
                    'referencia_bancaria' => $pago->referencia_bancaria,
                ],
            ], 422);
        }

        return response()->json([
            'resultado' => [
                'resultado' => true,
                'id' => $cita->id,
            ],
            'id' => $cita->id,
            'pago' => [
                'id' => $pago->id,
                'metodo' => $pago->metodo,
                'estado' => $pago->estado,
                'monto' => (float) $pago->monto,
                'moneda' => $pago->moneda,
                'gateway' => $pago->gateway,
                'referencia_bancaria' => $pago->referencia_bancaria,
                'codigo_autorizacion' => $pago->codigo_autorizacion,
                'ultimos_4' => $pago->ultimos_4,
                'marca_tarjeta' => $pago->marca_tarjeta,
                'terminal_id' => $pago->terminal_id,
                'mensaje' => $paymentResult->mensaje,
            ],
        ]);
    }

    /**
     * Exclusivo Admin: permite ajustar fecha, hora o barbero ante cualquier imprevisto.
     */
    public function reagendar(Request $request, Cita $cita): JsonResponse
    {
        $validated = $request->validate([
            'fecha' => ['required', 'date'],
            'hora' => ['required', 'string'],
            'barberoId' => ['nullable', 'integer', 'exists:usuarios,id'],
        ], [
            'fecha.required' => 'La fecha es obligatoria',
            'hora.required' => 'La hora es obligatoria',
        ]);

        $cita->update([
            'fecha' => $validated['fecha'],
            'hora' => $validated['hora'],
            'barberoId' => ! empty($validated['barberoId']) ? (int) $validated['barberoId'] : null,
        ]);

        return response()->json([
            'ok' => true,
            'mensaje' => 'Cita reagendada correctamente por el administrador',
            'cita' => $cita->fresh(['barbero:id,nombre,apellido']),
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

    private function hayEmpalme(
        string $fecha,
        string $hora,
        ?int $barberoId,
        ?int $excluirCitaId = null,
        int $minutosEmpalme = self::MINUTOS_EMPALME
    ): bool {
        $nuevoMin = $this->horaAMinutos($hora);
        if ($nuevoMin === null) {
            return false;
        }

        $query = Cita::where('fecha', $fecha);
        if ($barberoId !== null) {
            $query->where('barberoId', $barberoId);
        } else {
            // Si no hay barberos registrados todavía, valida contra citas sin barbero
            $hayBarberos = Usuario::barberos()->where('activo', true)->exists();
            if ($hayBarberos) {
                return false;
            }
        }

        if ($excluirCitaId !== null) {
            $query->where('id', '!=', $excluirCitaId);
        }

        foreach ($query->pluck('hora') as $horaExistente) {
            $existenteMin = $this->horaAMinutos((string) $horaExistente);
            if ($existenteMin !== null && abs($nuevoMin - $existenteMin) < $minutosEmpalme) {
                return true;
            }
        }

        return false;
    }

    private function horaAMinutos(string $hora): ?int
    {
        $partes = explode(':', trim($hora));
        if (count($partes) < 2 || ! is_numeric($partes[0]) || ! is_numeric($partes[1])) {
            return null;
        }

        return ((int) $partes[0] * 60) + (int) $partes[1];
    }
}
