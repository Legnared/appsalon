<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Services\BitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PagoWebhookController extends Controller
{
    public function handle(Request $request, string $gateway): JsonResponse
    {
        // Validación de secreto de webhook cuando está configurado en entorno
        $webhookSecret = trim((string) config('payments.drivers.bank_api.webhook_secret', ''));
        if ($webhookSecret !== '') {
            $headerSecret = (string) ($request->header('X-Webhook-Secret') ?? $request->header('x-signature') ?? '');
            $hmacEsperado = hash_hmac('sha256', (string) $request->getContent(), $webhookSecret);
            $firmaValida = hash_equals($webhookSecret, $headerSecret) || hash_equals($hmacEsperado, $headerSecret);

            if (! $firmaValida) {
                BitacoraService::registrar(
                    modulo: 'pagos',
                    accion: 'webhook_firma_invalida',
                    descripcion: "Webhook rechazado desde {$gateway} por firma/secreto inválido.",
                    detalles: ['gateway' => $gateway, 'ip' => $request->ip(), 'actor_rol' => 'webhook'],
                    nivel: 'error'
                );

                return response()->json(['ok' => false, 'mensaje' => 'Firma de webhook inválida'], 401);
            }
        }

        $referencia = $request->input('transaction_id')
            ?? $request->input('referencia_bancaria')
            ?? $request->input('intent_id');

        if (! $referencia) {
            BitacoraService::registrar(
                modulo: 'pagos',
                accion: 'webhook_sin_referencia',
                descripcion: "Webhook recibido desde {$gateway} sin referencia bancaria.",
                detalles: ['gateway' => $gateway, 'payload' => $request->all(), 'actor_rol' => 'webhook'],
                nivel: 'alerta'
            );

            return response()->json(['ok' => false, 'mensaje' => 'Referencia no proporcionada'], 400);
        }

        $pago = Pago::withoutGlobalScope('tenant')->where('referencia_bancaria', $referencia)->first();

        if (! $pago) {
            BitacoraService::registrar(
                modulo: 'pagos',
                accion: 'webhook_pago_no_encontrado',
                descripcion: "Webhook {$gateway} con referencia {$referencia} no coincide con ningún pago.",
                detalles: ['gateway' => $gateway, 'referencia' => $referencia, 'actor_rol' => 'webhook'],
                nivel: 'alerta'
            );

            return response()->json(['ok' => false, 'mensaje' => 'Pago no encontrado'], 404);
        }

        $estadoAnterior = $pago->estado;
        $status = strtolower((string) ($request->input('status') ?? ''));
        $nuevoEstado = match ($status) {
            'approved', 'paid', 'succeeded', 'pagado' => 'pagado',
            'declined', 'failed', 'fallido' => 'fallido',
            'refunded', 'reembolsado' => 'reembolsado',
            default => $pago->estado,
        };

        $pago->update([
            'gateway' => $gateway,
            'estado' => $nuevoEstado,
            'codigo_autorizacion' => $request->input('authorization_code', $pago->codigo_autorizacion),
            'ultimos_4' => $request->input('last4', $pago->ultimos_4),
            'marca_tarjeta' => $request->input('card_brand', $pago->marca_tarjeta),
            'respuesta_payload' => array_merge($pago->respuesta_payload ?? [], ['webhook' => $request->all()]),
            'pagado_en' => $nuevoEstado === 'pagado' ? now() : $pago->pagado_en,
        ]);

        BitacoraService::registrar(
            modulo: 'pagos',
            accion: 'webhook_procesado',
            descripcion: "Webhook {$gateway} actualizó pago #{$pago->id} (cita #{$pago->citaId}) de {$estadoAnterior} a {$nuevoEstado}.",
            detalles: [
                'gateway' => $gateway,
                'referencia' => $referencia,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $nuevoEstado,
                'actor_rol' => 'webhook',
            ],
            nivel: $nuevoEstado === 'fallido' ? 'error' : 'exito',
            entidadTipo: 'Pago',
            entidadId: $pago->id
        );

        return response()->json(['ok' => true, 'estado' => $nuevoEstado]);
    }
}
