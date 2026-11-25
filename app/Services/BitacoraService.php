<?php

namespace App\Services;

use App\Models\BitacoraEvento;
use App\Models\Usuario;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

class BitacoraService
{
    /**
     * Registra un evento inmutable en la bitácora del sistema.
     * Nunca interrumpe el flujo principal si ocurre un error de almacenamiento.
     */
    public static function registrar(
        string $modulo,
        string $accion,
        string $descripcion,
        array $detalles = [],
        string $nivel = 'info',
        ?string $entidadTipo = null,
        ?int $entidadId = null,
        ?Usuario $actor = null
    ): void {
        try {
            /** @var Usuario|null $usuario */
            $usuario = $actor ?? Auth::user();
            $request = app()->bound('request') ? request() : null;

            $rol = 'sistema';
            if ($usuario) {
                $rol = $usuario->esAdmin()
                    ? 'admin'
                    : ($usuario->esBarbero() ? 'barbero' : 'cliente');
            }

            BitacoraEvento::create([
                'tenant_id' => app(TenantContext::class)->id() ?? $usuario?->tenant_id,
                'modulo' => $modulo,
                'accion' => $accion,
                'nivel' => in_array($nivel, ['info', 'exito', 'alerta', 'error'], true) ? $nivel : 'info',
                'descripcion' => mb_substr($descripcion, 0, 255),
                'usuario_id' => $usuario?->id,
                'usuario_nombre' => $usuario?->nombre_completo ?: ($detalles['actor_label'] ?? 'Sistema'),
                'usuario_rol' => $detalles['actor_rol'] ?? $rol,
                'entidad_tipo' => $entidadTipo,
                'entidad_id' => $entidadId,
                'ip_address' => $request?->ip(),
                'user_agent' => $request ? mb_substr((string) $request->userAgent(), 0, 255) : null,
                'detalles' => count($detalles) > 0 ? $detalles : null,
            ]);
        } catch (Throwable $e) {
            Log::warning('No se pudo registrar evento en bitácora', [
                'modulo' => $modulo,
                'accion' => $accion,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
