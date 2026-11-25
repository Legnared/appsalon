<?php

namespace Database\Seeders;

use App\Models\Servicio;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class CatalogoBarberiaSeeder extends Seeder
{
    /**
     * Catálogo fotográfico profesional de cortes actuales con guía de visagismo por tipo de rostro.
     */
    public function run(): void
    {
        $servicios = [
            [
                'nombre' => 'Low Fade Texturizado',
                'precio' => 220.00,
                'duracion_minutos' => 45,
                'descripcion' => 'Degradado bajo limpio en laterales con textura y volumen controlado en la parte superior. Incluye lavado y peinado con cera mate.',
                'imagen' => 'servicios/low-fade-texturizado.jpg',
                'activo' => true,
                'tipos_rostro' => ['redondo', 'ovalado', 'cuadrado'],
                'recomendacion_rostro' => 'Rebaja los laterales sin ensanchar mejillas y agrega altura arriba para estilizar rostros redondos o llenos.',
            ],
            [
                'nombre' => 'Mid Taper + Pompadour Moderno',
                'precio' => 250.00,
                'duracion_minutos' => 50,
                'descripcion' => 'Taper medio en patillas y nuca combinado con copete estructurado de volumen natural. Acabado con secadora y fijación flexible.',
                'imagen' => 'servicios/taper-pompadour.jpg',
                'activo' => true,
                'tipos_rostro' => ['redondo', 'ovalado'],
                'recomendacion_rostro' => 'El volumen frontal alarga visualmente rostros redondos o con cachetes, creando un perfil más estilizado.',
            ],
            [
                'nombre' => 'French Crop Texturizado',
                'precio' => 220.00,
                'duracion_minutos' => 40,
                'descripcion' => 'Corte europeo corto con fleco texturizado al frente y fade medio definido. Práctico, moderno y de bajo mantenimiento.',
                'imagen' => 'servicios/french-crop.jpg',
                'activo' => true,
                'tipos_rostro' => ['ovalado', 'alargado', 'diamante'],
                'recomendacion_rostro' => 'El fleco corto equilibra frentes amplias y acorta visualmente rostros alargados o diamante.',
            ],
            [
                'nombre' => 'Buzz Cut + Skin Fade & Barba',
                'precio' => 260.00,
                'duracion_minutos' => 45,
                'descripcion' => 'Corte rasurado uniforme con desvanecido a piel (skin fade) y perfilado de barba con navaja para máxima definición.',
                'imagen' => 'servicios/buzz-skin-fade.jpg',
                'activo' => true,
                'tipos_rostro' => ['cuadrado', 'ovalado', 'diamante'],
                'recomendacion_rostro' => 'Resalta mandíbulas marcadas y rasgos simétricos con un look limpio y varonil.',
            ],
            [
                'nombre' => 'Mullet Moderno / Burst Fade',
                'precio' => 260.00,
                'duracion_minutos' => 50,
                'descripcion' => 'Degradado curvo alrededor de la oreja (burst fade) con caída texturizada en nuca. Tendencia actual de barbería urbana.',
                'imagen' => 'servicios/mullet-burst-fade.jpg',
                'activo' => true,
                'tipos_rostro' => ['ovalado', 'diamante', 'alargado'],
                'recomendacion_rostro' => 'Aporta dinamismo en laterales y suaviza pómulos marcados.',
            ],
            [
                'nombre' => 'Corte Clásico a Tijera (Side Part)',
                'precio' => 230.00,
                'duracion_minutos' => 45,
                'descripcion' => 'Corte ejecutivo trabajado a tijera y peine con raya lateral definida. Elegancia atemporal para oficina o eventos.',
                'imagen' => 'servicios/clasico-side-part.jpg',
                'activo' => true,
                'tipos_rostro' => ['redondo', 'cuadrado', 'ovalado'],
                'recomendacion_rostro' => 'La línea lateral asimétrica rompe la redondez y aporta estructura formal al rostro.',
            ],
            [
                'nombre' => 'Perfilado de Barba + Toalla Caliente',
                'precio' => 160.00,
                'duracion_minutos' => 30,
                'descripcion' => 'Ritual artesanal con toalla caliente, aceites esenciales, diseño angular con navaja y bálsamo hidratante.',
                'imagen' => 'servicios/perfilado-barba-toalla.jpg',
                'activo' => true,
                'tipos_rostro' => ['redondo', 'cuadrado', 'ovalado', 'alargado', 'diamante'],
                'recomendacion_rostro' => 'Una barba perfilada en ángulo en la mandíbula afina rostros redondos y define el contorno facial.',
            ],
            [
                'nombre' => 'Combo Corte Fade + Barba Completa',
                'precio' => 340.00,
                'duracion_minutos' => 60,
                'descripcion' => 'Experiencia completa de barbería: corte degradado a tu estilo + diseño y perfilado de barba con navaja, toalla caliente y lavado.',
                'imagen' => 'servicios/combo-fade-barba.jpg',
                'activo' => true,
                'tipos_rostro' => ['redondo', 'ovalado', 'cuadrado'],
                'recomendacion_rostro' => 'Combina volumen superior y barba angulada: el dúo más favorecedor para estilizar cualquier rostro.',
            ],
        ];

        $tenantId = Tenant::where('slug', 'dannys')->value('id')
            ?? Tenant::orderBy('id')->value('id');

        $nombresCatalogo = array_column($servicios, 'nombre');

        // Eliminar solo servicios viejos de prueba dentro del tenant de Danny's (nunca tocar otros tenants)
        Servicio::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->whereNotIn('nombre', $nombresCatalogo)
            ->delete();

        foreach ($servicios as $servicio) {
            Servicio::withoutGlobalScope('tenant')->updateOrCreate(
                ['tenant_id' => $tenantId, 'nombre' => $servicio['nombre']],
                array_merge($servicio, ['tenant_id' => $tenantId])
            );
        }
    }
}
