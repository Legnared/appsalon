<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    public function __construct(
        private readonly TenantContext $tenantContext,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! Schema::hasTable('tenants')) {
            return $next($request);
        }

        $tenant = $this->resolveFromRequest($request);

        $esRutaSuperAdmin = $request->is('super-admin', 'super-admin/*', 'logout');

        if ($tenant && ! $tenant->activo) {
            if ($esRutaSuperAdmin) {
                if ($request->hasSession()) {
                    $request->session()->forget(['superadmin_preview_tenant_slug', 'dev_tenant_slug']);
                }
                $tenant = Tenant::where('activo', true)->orderBy('id')->first() ?? $tenant;
            } else {
                abort(403, "La suscripción de {$tenant->nombre} se encuentra temporalmente suspendida. Contacta al administrador.");
            }
        }

        $this->tenantContext->set($tenant);
        View::share('currentTenant', $tenant);

        return $next($request);
    }

    private function resolveFromRequest(Request $request): ?Tenant
    {
        $host = strtolower(trim($request->getHost()));

        // 1. Previsualización de Super-Admin (1 clic desde /super-admin, funciona en local y producción)
        if ($request->hasSession() && $request->session()->has('superadmin_preview_tenant_slug')) {
            $user = $request->user();
            if ($user && method_exists($user, 'puedeVerBitacora') && $user->puedeVerBitacora()) {
                $previewSlug = (string) $request->session()->get('superadmin_preview_tenant_slug', '');
                if ($previewSlug !== '') {
                    $byPreview = Tenant::where('slug', $previewSlug)->first();
                    if ($byPreview) {
                        return $byPreview;
                    }
                }
            }
        }

        // 2. Selector por query (?tenant=slug) con prioridad en entorno local/testing
        if (app()->environment(['local', 'testing'])) {
            $requestedSlug = trim((string) $request->query('tenant', ''));
            if ($requestedSlug !== '') {
                $byQuery = Tenant::where('slug', $requestedSlug)->first();
                if ($byQuery) {
                    $request->session()->put('dev_tenant_slug', $byQuery->slug);
                    $request->session()->forget('superadmin_preview_tenant_slug');

                    return $byQuery;
                }
            }

            $sessionSlug = (string) $request->session()->get('dev_tenant_slug', '');
            if ($sessionSlug !== '') {
                $bySession = Tenant::where('slug', $sessionSlug)->first();
                if ($bySession) {
                    return $bySession;
                }
            }
        }

        // 2. Coincidencia exacta por dominio personalizado (ej. dannysbarbershop.com o dannys-barbershop.up.railway.app)
        if ($host !== '' && ! in_array($host, ['localhost', '127.0.0.1'], true)) {
            $byDomain = Tenant::where('dominio_custom', $host)->first();
            if ($byDomain) {
                return $byDomain;
            }
        }

        // 3. Coincidencia por subdominio (slug.dominio.com)
        $subdomain = $this->extractSubdomain($host);
        if ($subdomain !== null) {
            $bySlug = Tenant::where('slug', $subdomain)->first();
            if ($bySlug) {
                return $bySlug;
            }
        }

        // 4. Fallback al primer tenant activo (garantiza 0 regresiones en Danny's BarberShop)
        return Tenant::where('activo', true)->orderBy('id')->first()
            ?? Tenant::orderBy('id')->first();
    }

    private function extractSubdomain(string $host): ?string
    {
        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
            return null;
        }

        $baseDomain = strtolower(trim((string) config('app.base_domain', ''), " .\t\n\r\0\x0B"));
        if ($baseDomain !== '' && str_ends_with($host, '.' . $baseDomain)) {
            $sub = substr($host, 0, -strlen('.' . $baseDomain));
            if ($sub !== '' && ! str_contains($sub, '.') && ! in_array($sub, ['www', 'api', 'admin'], true)) {
                return $sub;
            }

            return null;
        }

        $parts = explode('.', $host);
        if (count($parts) < 3) {
            return null;
        }

        $candidate = $parts[0];
        if (in_array($candidate, ['www', 'api', 'admin'], true)) {
            return null;
        }

        return $candidate;
    }
}
