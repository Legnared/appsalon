<?php

namespace App\Http\Controllers;

use App\Models\BarberoAusencia;
use App\Models\Cita;
use App\Models\CitaServicio;
use App\Models\HorarioLaboral;
use App\Models\Pago;
use App\Models\Servicio;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\Payments\DTOs\CardPaymentRequestData;
use App\Services\Payments\DTOs\TerminalPaymentRequestData;
use App\Services\Payments\PaymentManager;
use App\Services\TenantContext;
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

        // Spec 022: Verificar si el barbero seleccionado tiene ausencia / vacaciones en esta fecha
        if (is_numeric($barberoId)) {
            $ausencia = BarberoAusencia::barberoAusenteEnFecha((int) $barberoId, $fecha);
            if ($ausencia) {
                return response()->json([
                    'fecha' => $fecha,
                    'abierto' => true,
                    'barbero_ausente' => true,
                    'barbero_id' => (int) $barberoId,
                    'barbero_nombre' => $ausencia->barbero?->nombre_completo ?? 'El barbero seleccionado',
                    'motivo_ausencia' => $ausencia->motivo ?: 'Día libre / No disponible',
                    'ausencia_fecha_inicio' => $ausencia->fecha_inicio?->toDateString(),
                    'ausencia_fecha_fin' => $ausencia->fecha_fin?->toDateString(),
                    'slots' => [],
                ]);
            }
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

    public function guardar(Request $request, PaymentManager $payments, TenantContext $tenantContext): JsonResponse
    {
        $tenantPayments = $tenantContext->paymentConfig();
        $driverActual = (string) ($tenantPayments['driver'] ?? config('payments.default', 'sandbox'));
        $requiereTarjetaDirecta = $request->input('metodo_pago') === 'tarjeta_online' && $driverActual !== 'mercadopago';

        $validated = $request->validate([
            'fecha' => ['required', 'date'],
            'hora' => ['required', 'string'],
            'barberoId' => ['nullable', 'integer', 'exists:usuarios,id'],
            'para_quien' => ['nullable', 'in:titular,hijo,familiar'],
            'nombre_beneficiario' => ['required_if:para_quien,hijo,familiar', 'nullable', 'string', 'max:80'],
            'servicios' => ['required'],
            'tipo_cobro' => ['nullable', 'in:anticipo,total'],
            'metodo_pago' => ['nullable', 'in:tarjeta_online,mercadopago,transferencia,terminal_pos,efectivo'],
            'tarjeta_titular' => [$requiereTarjetaDirecta ? 'required' : 'nullable', 'string', 'max:100'],
            'tarjeta_numero' => [$requiereTarjetaDirecta ? 'required' : 'nullable', 'string', 'min:15', 'max:25'],
            'tarjeta_expiracion' => [$requiereTarjetaDirecta ? 'required' : 'nullable', 'string', 'max:7'],
            'tarjeta_cvv' => [$requiereTarjetaDirecta ? 'required' : 'nullable', 'string', 'min:3', 'max:4'],
            'terminal_modo' => ['nullable', 'in:en_sucursal,enviar_terminal'],
        ], [
            'fecha.required' => 'La fecha es obligatoria',
            'hora.required' => 'La hora es obligatoria',
            'servicios.required' => 'Debes seleccionar al menos un servicio',
            'nombre_beneficiario.required_if' => 'Indica el nombre de tu hijo o familiar para esta cita',
            'tarjeta_titular.required' => 'El nombre del titular de la tarjeta es obligatorio',
            'tarjeta_numero.required' => 'El número de tarjeta es obligatorio',
            'tarjeta_expiracion.required' => 'La fecha de expiración es obligatoria',
            'tarjeta_cvv.required' => 'El código CVV es obligatorio',
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

        // Spec 022: Bloquear reservación si el barbero tiene ausencia/vacaciones en esa fecha
        if ($barberoId !== null) {
            $ausencia = BarberoAusencia::barberoAusenteEnFecha($barberoId, $validated['fecha']);
            if ($ausencia) {
                $nombreBarbero = $ausencia->barbero?->nombre_completo ?? 'El barbero seleccionado';
                $motivoTexto = $ausencia->motivo ? " ({$ausencia->motivo})" : '';

                return response()->json([
                    'resultado' => false,
                    'mensaje' => "{$nombreBarbero} no labora en esa fecha{$motivoTexto}. Por favor elige otro barbero disponible o selecciona otra fecha.",
                ], 422);
            }
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

        $montoTotal = round((float) $serviciosDb->sum('precio'), 2);
        $moneda = (string) ($tenantPayments['currency'] ?? config('payments.currency', 'MXN'));
        $metodoPago = $validated['metodo_pago'] ?? 'terminal_pos';
        $tipoCobro = $validated['tipo_cobro'] ?? 'total';

        // Calcular monto del pago inicial (Anticipo configurable por tenant o 100%)
        if ($tipoCobro === 'anticipo') {
            $anticipoTipo = (string) ($tenantPayments['anticipo_tipo'] ?? config('payments.anticipo.tipo', 'fijo'));
            $anticipoValor = (float) ($tenantPayments['anticipo_valor'] ?? config('payments.anticipo.valor', 100));
            $montoAnticipo = $anticipoTipo === 'porcentaje'
                ? round($montoTotal * ($anticipoValor / 100), 2)
                : $anticipoValor;
            $montoACobrar = round(min($montoTotal, max(1.0, $montoAnticipo)), 2);
            if ($montoACobrar >= $montoTotal) {
                $tipoCobro = 'total';
            }
        } else {
            $montoACobrar = $montoTotal;
        }

        $usuario = $request->user();
        $usuarioId = $usuario?->id ?? $request->input('usuarioId');

        $gateway = $payments->driver($metodoPago === 'mercadopago' ? 'mercadopago' : null);

        $resultadoTransaccion = DB::transaction(function () use (
            $validated,
            $usuarioId,
            $usuario,
            $barberoId,
            $serviciosDb,
            $montoTotal,
            $montoACobrar,
            $tipoCobro,
            $moneda,
            $metodoPago,
            $gateway,
            $tenantPayments
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

            $linkPago = null;
            $montoPagado = 0.0;
            $saldoPendiente = $montoTotal;
            $estadoFinal = 'pendiente';
            $mensajePago = null;
            $aprobado = true;

            if ($metodoPago === 'tarjeta_online' || $metodoPago === 'mercadopago') {
                $paymentResult = $gateway->chargeCard(
                    $cita,
                    new CardPaymentRequestData(
                        monto: $montoACobrar,
                        moneda: $moneda,
                        titular: (string) ($validated['tarjeta_titular'] ?? $usuario?->nombre_completo ?? 'Cliente'),
                        numeroTarjeta: (string) ($validated['tarjeta_numero'] ?? ''),
                        expiracion: (string) ($validated['tarjeta_expiracion'] ?? ''),
                        cvv: (string) ($validated['tarjeta_cvv'] ?? ''),
                        emailCliente: $usuario?->email,
                    )
                );

                $aprobado = $paymentResult->aprobado;
                $mensajePago = $paymentResult->mensaje;
                $linkPago = $paymentResult->payload['init_point']
                    ?? $paymentResult->payload['sandbox_init_point']
                    ?? null;

                if ($paymentResult->estado === 'pagado') {
                    $montoPagado = $montoACobrar;
                    $saldoPendiente = round(max(0.0, $montoTotal - $montoPagado), 2);
                    $estadoFinal = $saldoPendiente > 0 ? 'anticipo_pagado' : 'pagado';
                } else {
                    $estadoFinal = $paymentResult->estado;
                }

                $pago = Pago::create([
                    'citaId' => $cita->id,
                    'usuarioId' => $usuarioId,
                    'monto' => $montoACobrar,
                    'monto_total' => $montoTotal,
                    'monto_pagado' => $montoPagado,
                    'saldo_pendiente' => $saldoPendiente,
                    'moneda' => $moneda,
                    'tipo_cobro' => $tipoCobro,
                    'metodo' => $metodoPago,
                    'gateway' => $paymentResult->gateway,
                    'estado' => $estadoFinal,
                    'referencia_bancaria' => $paymentResult->referenciaBancaria,
                    'codigo_autorizacion' => $paymentResult->codigoAutorizacion,
                    'ultimos_4' => $paymentResult->ultimos4,
                    'marca_tarjeta' => $paymentResult->marcaTarjeta,
                    'terminal_id' => $paymentResult->terminalId,
                    'link_pago' => $linkPago,
                    'respuesta_payload' => $paymentResult->payload,
                    'pagado_en' => in_array($estadoFinal, ['pagado', 'anticipo_pagado'], true) ? now() : null,
                ]);
            } elseif ($metodoPago === 'transferencia') {
                $referenciaSpei = 'CITA-' . $cita->id . '-' . strtoupper(substr(uniqid(), -4));
                $mensajePago = $tipoCobro === 'anticipo'
                    ? "Transfiere tu anticipo de $" . number_format($montoACobrar, 2) . " MXN y envía el comprobante por WhatsApp."
                    : "Transfiere el total de $" . number_format($montoTotal, 2) . " MXN y envía el comprobante por WhatsApp.";

                $pago = Pago::create([
                    'citaId' => $cita->id,
                    'usuarioId' => $usuarioId,
                    'monto' => $montoACobrar,
                    'monto_total' => $montoTotal,
                    'monto_pagado' => 0.0,
                    'saldo_pendiente' => $montoTotal,
                    'moneda' => $moneda,
                    'tipo_cobro' => $tipoCobro,
                    'metodo' => 'transferencia',
                    'gateway' => 'spei',
                    'estado' => 'pendiente',
                    'referencia_bancaria' => $referenciaSpei,
                    'respuesta_payload' => [
                        'spei' => $tenantPayments['spei'] ?? config('payments.spei'),
                        'monto_esperado' => $montoACobrar,
                    ],
                ]);
            } else {
                $paymentResult = $gateway->initiateTerminalPayment(
                    $cita,
                    new TerminalPaymentRequestData(
                        monto: $montoTotal,
                        moneda: $moneda,
                        modo: $validated['terminal_modo'] ?? 'en_sucursal',
                    )
                );

                $mensajePago = $paymentResult->mensaje;

                $pago = Pago::create([
                    'citaId' => $cita->id,
                    'usuarioId' => $usuarioId,
                    'monto' => $montoTotal,
                    'monto_total' => $montoTotal,
                    'monto_pagado' => 0.0,
                    'saldo_pendiente' => $montoTotal,
                    'moneda' => $moneda,
                    'tipo_cobro' => 'total',
                    'metodo' => $metodoPago,
                    'gateway' => $paymentResult->gateway,
                    'estado' => 'pendiente',
                    'referencia_bancaria' => $paymentResult->referenciaBancaria,
                    'terminal_id' => $paymentResult->terminalId,
                    'respuesta_payload' => $paymentResult->payload,
                ]);
            }

            return [
                'cita' => $cita,
                'pago' => $pago,
                'aprobado' => $aprobado,
                'mensaje' => $mensajePago,
            ];
        });

        /** @var Cita $cita */
        $cita = $resultadoTransaccion['cita'];
        /** @var Pago $pago */
        $pago = $resultadoTransaccion['pago'];
        $aprobado = (bool) $resultadoTransaccion['aprobado'];
        $mensajePago = $resultadoTransaccion['mensaje'];

        if (in_array($metodoPago, ['tarjeta_online', 'mercadopago'], true) && ! $aprobado) {
            BitacoraService::registrar(
                modulo: 'pagos',
                accion: 'pago_rechazado',
                descripcion: "Pago rechazado para cita #{$cita->id} por \${$pago->monto} MXN ({$metodoPago}).",
                detalles: [
                    'cita_id' => $cita->id,
                    'pago_id' => $pago->id,
                    'metodo' => $metodoPago,
                    'monto' => (float) $pago->monto,
                    'referencia_bancaria' => $pago->referencia_bancaria,
                    'motivo' => $mensajePago,
                ],
                nivel: 'error',
                entidadTipo: 'Pago',
                entidadId: $pago->id
            );

            return response()->json([
                'resultado' => false,
                'mensaje' => $mensajePago ?? 'El pago con tarjeta fue rechazado por el banco',
                'pago' => [
                    'id' => $pago->id,
                    'estado' => $pago->estado,
                    'referencia_bancaria' => $pago->referencia_bancaria,
                ],
            ], 422);
        }

        BitacoraService::registrar(
            modulo: 'citas',
            accion: 'cita_creada',
            descripcion: "Cita #{$cita->id} agendada para {$cita->fecha} a las {$cita->hora} hrs.",
            detalles: [
                'cita_id' => $cita->id,
                'fecha' => $cita->fecha,
                'hora' => $cita->hora,
                'barbero_id' => $cita->barberoId,
                'para_quien' => $cita->para_quien,
                'nombre_beneficiario' => $cita->nombre_beneficiario,
                'servicios' => $serviciosDb->pluck('nombre')->values()->all(),
                'monto_total' => (float) $montoTotal,
            ],
            nivel: 'exito',
            entidadTipo: 'Cita',
            entidadId: $cita->id
        );

        BitacoraService::registrar(
            modulo: 'pagos',
            accion: match ($pago->estado) {
                'pagado' => 'pago_aprobado',
                'anticipo_pagado' => 'anticipo_aprobado',
                default => 'pago_pendiente_registrado',
            },
            descripcion: "Pago #{$pago->id} ({$pago->metodo}) para cita #{$cita->id}: estado {$pago->estado}, pagado \${$pago->monto_pagado} / total \${$pago->monto_total}.",
            detalles: [
                'cita_id' => $cita->id,
                'pago_id' => $pago->id,
                'tipo_cobro' => $pago->tipo_cobro,
                'metodo' => $pago->metodo,
                'gateway' => $pago->gateway,
                'estado' => $pago->estado,
                'monto_total' => (float) ($pago->monto_total ?? $pago->monto),
                'monto_pagado' => (float) ($pago->monto_pagado ?? 0),
                'saldo_pendiente' => (float) ($pago->saldo_pendiente ?? 0),
                'referencia_bancaria' => $pago->referencia_bancaria,
                'codigo_autorizacion' => $pago->codigo_autorizacion,
            ],
            nivel: in_array($pago->estado, ['pagado', 'anticipo_pagado'], true) ? 'exito' : 'info',
            entidadTipo: 'Pago',
            entidadId: $pago->id
        );

        return response()->json([
            'resultado' => [
                'resultado' => true,
                'id' => $cita->id,
            ],
            'id' => $cita->id,
            'pago' => [
                'id' => $pago->id,
                'metodo' => $pago->metodo,
                'tipo_cobro' => $pago->tipo_cobro,
                'estado' => $pago->estado,
                'monto' => (float) $pago->monto,
                'monto_total' => (float) ($pago->monto_total ?? $pago->monto),
                'monto_pagado' => (float) ($pago->monto_pagado ?? 0),
                'saldo_pendiente' => (float) ($pago->saldo_pendiente ?? 0),
                'moneda' => $pago->moneda,
                'gateway' => $pago->gateway,
                'referencia_bancaria' => $pago->referencia_bancaria,
                'codigo_autorizacion' => $pago->codigo_autorizacion,
                'ultimos_4' => $pago->ultimos_4,
                'marca_tarjeta' => $pago->marca_tarjeta,
                'terminal_id' => $pago->terminal_id,
                'link_pago' => $pago->link_pago,
                'mensaje' => $mensajePago,
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

        $antes = [
            'fecha' => $cita->fecha,
            'hora' => $cita->hora,
            'barberoId' => $cita->barberoId,
        ];

        $cita->update([
            'fecha' => $validated['fecha'],
            'hora' => $validated['hora'],
            'barberoId' => ! empty($validated['barberoId']) ? (int) $validated['barberoId'] : null,
        ]);

        BitacoraService::registrar(
            modulo: 'citas',
            accion: 'cita_reagendada',
            descripcion: "Cita #{$cita->id} reagendada de {$antes['fecha']} {$antes['hora']} a {$cita->fecha} {$cita->hora}.",
            detalles: [
                'antes' => $antes,
                'despues' => [
                    'fecha' => $cita->fecha,
                    'hora' => $cita->hora,
                    'barberoId' => $cita->barberoId,
                ],
            ],
            nivel: 'alerta',
            entidadTipo: 'Cita',
            entidadId: $cita->id
        );

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
            $cita = Cita::with(['usuario:id,nombre,apellido', 'pago'])->find($id);
            if ($cita) {
                $resumenCita = [
                    'cita_id' => $cita->id,
                    'fecha' => $cita->fecha,
                    'hora' => $cita->hora,
                    'cliente' => $cita->usuario?->nombre_completo,
                    'pago_estado' => $cita->pago?->estado,
                    'monto_pagado' => $cita->pago?->monto_pagado,
                ];
                $cita->delete();

                BitacoraService::registrar(
                    modulo: 'citas',
                    accion: 'cita_eliminada',
                    descripcion: "Cita #{$resumenCita['cita_id']} ({$resumenCita['fecha']} {$resumenCita['hora']}) fue eliminada.",
                    detalles: $resumenCita,
                    nivel: 'alerta',
                    entidadTipo: 'Cita',
                    entidadId: (int) $resumenCita['cita_id']
                );
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
