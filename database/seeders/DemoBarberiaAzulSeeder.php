<?php

namespace Database\Seeders;

use App\Models\HorarioLaboral;
use App\Models\Servicio;
use App\Models\Tenant;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class DemoBarberiaAzulSeeder extends Seeder
{
    /**
     * Siembra una segunda barbería SaaS ("Kingsman Barber Club", tema Azul Barbería)
     * con dueño, barbero, cliente, horarios y catálogo propios para demostrar Multi-Tenant.
     *
     * Uso manual:
     *   php artisan db:seed --class=DemoBarberiaAzulSeeder
     */
    public function run(): void
    {
        $tenant = Tenant::updateOrCreate(
            ['slug' => 'kingsman'],
            [
                'nombre' => 'Kingsman Barber Club',
                'dominio_custom' => null,
                'activo' => true,
                'plan' => 'anual',
                'suscripcion_vence_en' => now()->addYear()->toDateString(),
                'tagline' => 'Estilo Ejecutivo · Fade · Barba de Precisión',
                'logo' => '/img/icono.png',
                'hero_imagen' => '/img/1.webp',
                'color_primario' => '#2f80ed', // Azul Barbería moderno
                'whatsapp_negocio' => '5215512345678',
                'payment_driver' => 'sandbox',
                'moneda' => 'MXN',
                'anticipo_tipo' => 'fijo',
                'anticipo_valor' => 120.00,
                'spei_banco' => 'BBVA / STP',
                'spei_titular' => 'Carlos Mendoza · Kingsman',
                'spei_clabe' => '012180001234567890',
                'configuracion_extra' => [
                    'features' => [
                        'pagos_online' => true,
                        'spei' => true,
                        'multi_barbero' => true,
                        'citas_familiares' => true,
                        'visagismo' => true,
                        'crm_clientes' => true,
                        'dominio_propio' => true,
                    ],
                ],
            ]
        );

        // 1. Dueño / Admin operativo de Kingsman
        Usuario::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'email' => 'carlos@kingsman.test'],
            [
                'nombre' => 'Carlos',
                'apellido' => 'Mendoza',
                'password' => 'kingsman123',
                'telefono' => '5512345678',
                'admin' => true,
                'rol' => 'admin',
                'es_barbero' => true,
                'especialidad' => 'Master Barber · Skin Fade & Ejecutivo',
                'activo' => true,
                'confirmado' => true,
                'token' => null,
            ]
        );

        // 2. Segundo barbero del equipo
        Usuario::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'email' => 'mateo@kingsman.test'],
            [
                'nombre' => 'Mateo',
                'apellido' => 'Ríos',
                'password' => 'mateo123',
                'telefono' => '5587654321',
                'admin' => false,
                'rol' => 'barbero',
                'es_barbero' => true,
                'especialidad' => 'Barba a Navaja · Crop & Taper',
                'activo' => true,
                'confirmado' => true,
                'token' => null,
            ]
        );

        // 3. Cliente de demostración en Kingsman
        Usuario::withoutGlobalScope('tenant')->updateOrCreate(
            ['tenant_id' => $tenant->id, 'email' => 'cliente@kingsman.test'],
            [
                'nombre' => 'Luis',
                'apellido' => 'Hernández',
                'password' => 'cliente123',
                'telefono' => '5544332211',
                'admin' => false,
                'rol' => 'cliente',
                'es_barbero' => false,
                'activo' => true,
                'confirmado' => true,
                'token' => null,
            ]
        );

        // 4. Horarios propios (L-S 09:00 a 20:00, Domingo cerrado)
        $dias = [
            [1, 'Lunes', true, '09:00:00', '20:00:00'],
            [2, 'Martes', true, '09:00:00', '20:00:00'],
            [3, 'Miércoles', true, '09:00:00', '20:00:00'],
            [4, 'Jueves', true, '09:00:00', '20:00:00'],
            [5, 'Viernes', true, '09:00:00', '20:00:00'],
            [6, 'Sábado', true, '09:00:00', '19:00:00'],
            [0, 'Domingo', false, '10:00:00', '15:00:00'],
        ];

        foreach ($dias as [$diaSemana, $nombreDia, $abierto, $apertura, $cierre]) {
            HorarioLaboral::withoutGlobalScope('tenant')->updateOrCreate(
                ['tenant_id' => $tenant->id, 'dia_semana' => $diaSemana],
                [
                    'nombre_dia' => $nombreDia,
                    'abierto' => $abierto,
                    'hora_apertura' => $apertura,
                    'hora_cierre' => $cierre,
                    'intervalo_minutos' => 60,
                ]
            );
        }

        // 5. Catálogo de servicios propio de Kingsman
        $servicios = [
            [
                'nombre' => 'Corte Ejecutivo Kingsman',
                'precio' => 260.00,
                'duracion_minutos' => 45,
                'descripcion' => 'Asesoría de estilo, corte a tijera/máquina, lavado y peinado con pomada mate.',
                'tipos_rostro' => ['ovalado', 'cuadrado'],
                'recomendacion_rostro' => 'Ideal para perfiles ejecutivos y rostros definidos.',
            ],
            [
                'nombre' => 'Skin Fade & Navaja',
                'precio' => 240.00,
                'duracion_minutos' => 40,
                'descripcion' => 'Degradado limpio a cero con acabado a navaja y loción refrescante.',
                'tipos_rostro' => ['redondo', 'ovalado', 'diamante'],
                'recomendacion_rostro' => 'Estiliza laterales y resalta la parte superior.',
            ],
            [
                'nombre' => 'Ritual de Barba Vapor & Toalla',
                'precio' => 190.00,
                'duracion_minutos' => 30,
                'descripcion' => 'Toalla caliente, aceite esencial de eucalipto, perfilado a navaja y bálsamo.',
                'tipos_rostro' => ['alargado', 'redondo'],
                'recomendacion_rostro' => 'Aporta simetría y contorno limpio a la mandíbula.',
            ],
            [
                'nombre' => 'Combo Club (Corte + Barba + Mascarilla)',
                'precio' => 420.00,
                'duracion_minutos' => 75,
                'descripcion' => 'Experiencia completa Kingsman con exfoliación facial de carbón activado.',
                'tipos_rostro' => ['ovalado', 'cuadrado', 'redondo'],
                'recomendacion_rostro' => 'El paquete insignia de la casa.',
            ],
            [
                'nombre' => 'Corte Junior / Escolar',
                'precio' => 170.00,
                'duracion_minutos' => 30,
                'descripcion' => 'Corte moderno y rápido pensado para niños y adolescentes.',
                'tipos_rostro' => ['ovalado', 'redondo'],
                'recomendacion_rostro' => 'Cómodo y fácil de peinar todos los días.',
            ],
        ];

        foreach ($servicios as $serv) {
            Servicio::withoutGlobalScope('tenant')->updateOrCreate(
                ['tenant_id' => $tenant->id, 'nombre' => $serv['nombre']],
                [
                    'precio' => $serv['precio'],
                    'duracion_minutos' => $serv['duracion_minutos'],
                    'descripcion' => $serv['descripcion'],
                    'tipos_rostro' => $serv['tipos_rostro'],
                    'recomendacion_rostro' => $serv['recomendacion_rostro'],
                    'activo' => true,
                ]
            );
        }

        $this->command?->info("Barbería demo 'Kingsman Barber Club' (slug: kingsman, color: #2f80ed) sembrada correctamente.");
    }
}
