<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanViewBitacora
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->puedeVerBitacora()) {
            if ($user && ($user->esAdmin() || $user->esBarbero())) {
                return redirect('/admin');
            }

            return redirect('/');
        }

        return $next($request);
    }
}
