<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Services\BitacoraService;
use App\Services\Payments\PaymentManager;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    public function cobrarEnTerminal(Request $request, Pago $pago, PaymentManager $payments, TenantContext $tenantContext): JsonResponse
    {
        $user = $request->user();
        $tenantId = $tenantContext->id();

        if ($tenantId !== null && $pago->tenant_id !== null && (int) $pago->tenant_id !== (int) $tenantId) {
            abort(403, 'Este pago pertenece a otra barbería.');
        }

        if ($user && ! $user->esAdmin()) {
            $cita = $pago->cita;
            if (! $cita || (int) $cita->barberoId !== (int) $user->id) {
                abort(403, 'Solo puedes liquidar citas asignadas a tu agenda.');
            }
        }

        $estadoAnterior = $pago->estado;
        $montoTotal = (float) ($pago->monto_total > 0 ? $pago->monto_total : $pago->monto);
        $saldoActual = (float) ($pago->saldo_pendiente > 0 ? $pago->saldo_pendiente : ($pago->estado === 'pagado' ? 0 : $montoTotal));

        if ($pago->estado === 'pagado' && $saldoActual <= 0) {
            return response()->json([
                'ok' => true,
                'mensaje' => 'Esta cita ya está liquidada al 100%',
                'pago' => $pago,
            ]);
        }

        $validated = $request->validate([
            'metodo_liquidacion' => ['nullable', 'in:terminal_pos,transferencia,efectivo'],
            'codigo_autorizacion' => ['nullable', 'string', 'max:30'],
            'ultimos_4' => ['nullable', 'string', 'max:4'],
            'marca_tarjeta' => ['nullable', 'string', 'max:20'],
            'terminal_id' => ['nullable', 'string', 'max:50'],
        ]);

        $metodoLiquidacion = $validated['metodo_liquidacion'] ?? 'terminal_pos';

        if ($metodoLiquidacion === 'terminal_pos') {
            $gateway = $payments->driver($pago->gateway);
            $result = $gateway->confirmTerminalPayment($pago, [
                ...$validated,
                'origen' => 'admin_pos',
            ]);

            $pago->update([
                'estado' => 'pagado',
                'monto_total' => $montoTotal,
                'monto_pagado' => $montoTotal,
                'saldo_pendiente' => 0,
                'metodo_liquidacion' => 'terminal_pos',
                'referencia_bancaria' => $result->referenciaBancaria ?? $pago->referencia_bancaria,
                'codigo_autorizacion' => $result->codigoAutorizacion,
                'ultimos_4' => $result->ultimos4 ?? $pago->ultimos_4,
                'marca_tarjeta' => $result->marcaTarjeta ?? $pago->marca_tarjeta,
                'terminal_id' => $result->terminalId ?? $pago->terminal_id,
                'respuesta_payload' => array_merge($pago->respuesta_payload ?? [], $result->payload),
                'pagado_en' => now(),
            ]);
        } else {
            $codigo = trim((string) ($validated['codigo_autorizacion'] ?? ''));
            $pago->update([
                'estado' => 'pagado',
                'monto_total' => $montoTotal,
                'monto_pagado' => $montoTotal,
                'saldo_pendiente' => 0,
                'metodo_liquidacion' => $metodoLiquidacion,
                'codigo_autorizacion' => $codigo !== '' ? $codigo : strtoupper($metodoLiquidacion === 'efectivo' ? 'EFECTIVO' : 'SPEI-OK'),
                'respuesta_payload' => array_merge($pago->respuesta_payload ?? [], [
                    'liquidacion' => [
                        'metodo' => $metodoLiquidacion,
                        'monto_liquidado' => $saldoActual,
                        'fecha' => now()->toDateTimeString(),
                    ],
                ]),
                'pagado_en' => now(),
            ]);
        }

        BitacoraService::registrar(
            modulo: 'pagos',
            accion: 'pago_liquidado',
            descripcion: "Saldo de cita #{$pago->citaId} liquidado por \${$saldoActual} MXN vía {$metodoLiquidacion}.",
            detalles: [
                'cita_id' => $pago->citaId,
                'pago_id' => $pago->id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => 'pagado',
                'metodo_inicial' => $pago->metodo,
                'metodo_liquidacion' => $metodoLiquidacion,
                'monto_total' => $montoTotal,
                'monto_liquidado' => $saldoActual,
                'codigo_autorizacion' => $pago->codigo_autorizacion,
            ],
            nivel: 'exito',
            entidadTipo: 'Pago',
            entidadId: $pago->id
        );

        return response()->json([
            'ok' => true,
            'mensaje' => 'Saldo liquidado correctamente',
            'pago' => $pago->fresh(),
        ]);
    }
}
