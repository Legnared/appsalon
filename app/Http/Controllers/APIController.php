<?php

namespace App\Http\Controllers;

use App\Models\Cita;
use App\Models\CitaServicio;
use App\Models\Pago;
use App\Models\Servicio;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class APIController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Servicio::where('activo', true)->orderBy('id')->get());
    }

    public function guardar(Request $request, PaymentManager $payments): JsonResponse
    {
        $validated = $request->validate([
            'fecha' => ['required', 'date'],
            'hora' => ['required', 'string'],
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
            'tarjeta_titular.required_if' => 'El nombre del titular de la tarjeta es obligatorio',
            'tarjeta_numero.required_if' => 'El número de tarjeta es obligatorio',
            'tarjeta_expiracion.required_if' => 'La fecha de expiración es obligatoria',
            'tarjeta_cvv.required_if' => 'El código CVV es obligatorio',
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

        // Para pago con tarjeta en línea, creamos la cita + pago y validamos el cobro
        $resultadoTransaccion = DB::transaction(function () use (
            $validated,
            $usuarioId,
            $usuario,
            $serviciosDb,
            $montoTotal,
            $moneda,
            $metodoPago,
            $gateway
        ) {
            $cita = Cita::create([
                'fecha' => $validated['fecha'],
                'hora' => $validated['hora'],
                'usuarioId' => $usuarioId,
            ]);

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
