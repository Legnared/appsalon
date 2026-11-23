<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    public function cobrarEnTerminal(Request $request, Pago $pago, PaymentManager $payments): JsonResponse
    {
        if ($pago->estado === 'pagado') {
            return response()->json([
                'ok' => true,
                'mensaje' => 'Esta cita ya se encuentra pagada',
                'pago' => $pago,
            ]);
        }

        $validated = $request->validate([
            'codigo_autorizacion' => ['nullable', 'string', 'max:30'],
            'ultimos_4' => ['nullable', 'string', 'max:4'],
            'marca_tarjeta' => ['nullable', 'string', 'max:20'],
            'terminal_id' => ['nullable', 'string', 'max:50'],
        ]);

        $gateway = $payments->driver($pago->gateway);
        $result = $gateway->confirmTerminalPayment($pago, [
            ...$validated,
            'origen' => 'admin_pos',
        ]);

        $pago->update([
            'estado' => $result->estado,
            'referencia_bancaria' => $result->referenciaBancaria ?? $pago->referencia_bancaria,
            'codigo_autorizacion' => $result->codigoAutorizacion,
            'ultimos_4' => $result->ultimos4,
            'marca_tarjeta' => $result->marcaTarjeta,
            'terminal_id' => $result->terminalId ?? $pago->terminal_id,
            'respuesta_payload' => array_merge($pago->respuesta_payload ?? [], $result->payload),
            'pagado_en' => $result->aprobado ? now() : null,
        ]);

        return response()->json([
            'ok' => $result->aprobado,
            'mensaje' => $result->mensaje ?? 'Cobro procesado en Terminal POS',
            'pago' => $pago->fresh(),
        ]);
    }
}
