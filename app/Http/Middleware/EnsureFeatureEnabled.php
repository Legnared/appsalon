<?php

namespace App\Http\Middleware;

use App\Services\FeatureManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureEnabled
{
    public function __construct(
        private readonly FeatureManager $features,
    ) {}

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (! $this->features->active($feature)) {
            abort(403, 'Este módulo no está activo en el plan actual de la barbería.');
        }

        return $next($request);
    }
}
