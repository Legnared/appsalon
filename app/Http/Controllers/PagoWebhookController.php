<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PagoWebhookController extends Controller
{
    public function handle(Request $request, string $gateway): JsonResponse
    {
        $referencia = $request->input('transaction_id')
            ?? $request->input('referencia_bancaria')
            ?? $request->input('intent_id');

        if (! $referencia) {
            return response()->json(['ok' => false, 'mensaje' => 'Referencia no proporcionada'], 400);
        }

        $pago = Pago::where('referencia_bancaria', $referencia)->first();

        if (! $pago) {
            return response()->json(['ok' => false, 'mensaje' => 'Pago no encontrado'], 404);
        }

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

        return response()->json(['ok' => true, 'estado' => $nuevoEstado]);
    }
}
