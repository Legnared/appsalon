<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStaff
{
    /**
     * Permite acceso a Administradores (dueño) y Barberos activos.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || (! $user->esAdmin() && ! $user->esBarbero())) {
            return redirect('/');
        }

        if ($user->esBarbero() && $user->activo === false) {
            return redirect('/')->withErrors([
                'email' => 'Tu cuenta de barbero se encuentra inactiva',
            ]);
        }

        return $next($request);
    }
}
