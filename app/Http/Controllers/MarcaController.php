<?php

namespace App\Http\Controllers;

use App\Services\BitacoraService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MarcaController extends Controller
{
    public function index(TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->current();

        return Inertia::render('Marca/Index', [
            'marcaActual' => [
                'nombre' => $tenant?->nombre ?? config('app.name', "Danny's BarberShop"),
                'tagline' => $tenant?->tagline ?? 'Corte Clásico · Barba · Estilo Artesanal',
                'color_primario' => $tenant?->color_primario ?: '#d4a259',
                'tema_diseno' => $tenant?->temaDiseno() ?? 'rustico_editorial',
                'logo_url' => $tenant?->logo_url ?? '/img/icono.png',
                'hero_url' => $tenant?->hero_url ?? '/img/1.webp',
                'tiene_logo_custom' => (bool) ($tenant?->logo && ! str_starts_with($tenant->logo, '/img/')),
                'tiene_hero_custom' => (bool) ($tenant?->hero_imagen && ! str_starts_with($tenant->hero_imagen, '/img/')),
            ],
        ]);
    }

    public function actualizar(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $tenantContext->current();

        if (! $tenant) {
            return back()->withErrors(['marca' => 'No se detectó una barbería activa para actualizar.']);
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:120'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'hero_imagen' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'eliminar_logo' => ['nullable', 'boolean'],
            'eliminar_hero' => ['nullable', 'boolean'],
        ], [
            'nombre.required' => 'El nombre de la barbería es obligatorio.',
            'logo.image' => 'El logo debe ser una imagen válida (JPG, PNG o WEBP).',
            'logo.max' => 'El logo no debe superar los 2 MB.',
            'hero_imagen.image' => 'La portada debe ser una imagen válida (JPG, PNG o WEBP).',
            'hero_imagen.max' => 'La imagen de portada no debe superar los 4 MB.',
        ]);

        $rutaLogo = $tenant->logo;
        if ($request->boolean('eliminar_logo')) {
            if ($rutaLogo && ! str_starts_with($rutaLogo, '/img/') && ! str_starts_with($rutaLogo, 'http')) {
                Storage::disk('public')->delete($rutaLogo);
            }
            $rutaLogo = '/img/icono.png';
        } elseif ($request->hasFile('logo')) {
            if ($rutaLogo && ! str_starts_with($rutaLogo, '/img/') && ! str_starts_with($rutaLogo, 'http')) {
                Storage::disk('public')->delete($rutaLogo);
            }
            $rutaLogo = $request->file('logo')->store($tenantContext->storagePath('branding'), 'public');
        }

        $rutaHero = $tenant->hero_imagen;
        if ($request->boolean('eliminar_hero')) {
            if ($rutaHero && ! str_starts_with($rutaHero, '/img/') && ! str_starts_with($rutaHero, 'http')) {
                Storage::disk('public')->delete($rutaHero);
            }
            $rutaHero = '/img/1.webp';
        } elseif ($request->hasFile('hero_imagen')) {
            if ($rutaHero && ! str_starts_with($rutaHero, '/img/') && ! str_starts_with($rutaHero, 'http')) {
                Storage::disk('public')->delete($rutaHero);
            }
            $rutaHero = $request->file('hero_imagen')->store($tenantContext->storagePath('branding'), 'public');
        }

        $tenant->update([
            'nombre' => trim($validated['nombre']),
            'tagline' => trim((string) ($validated['tagline'] ?? '')) ?: null,
            'logo' => $rutaLogo,
            'hero_imagen' => $rutaHero,
        ]);

        BitacoraService::registrar(
            modulo: 'tenants',
            accion: 'marca_actualizada',
            descripcion: "Personalización de marca/logo actualizada para '{$tenant->nombre}'.",
            detalles: ['tenant_id' => $tenant->id, 'color_primario' => $tenant->color_primario],
            nivel: 'exito',
            entidadTipo: 'Tenant',
            entidadId: $tenant->id
        );

        return redirect('/mi-marca')->with('exito', 'Marca, logo y colores actualizados correctamente.');
    }
}
