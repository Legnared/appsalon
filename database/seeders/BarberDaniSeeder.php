<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class BarberDaniSeeder extends Seeder
{
    /**
     * Registra a Barber Dani como Dueño/Administrador y Barbero activo en su tenant (Danny's).
     */
    public function run(): void
    {
        $tenantId = Tenant::where('slug', 'dannys')->value('id')
            ?? Tenant::orderBy('id')->value('id');

        Usuario::withoutGlobalScope('tenant')->updateOrCreate(
            ['email' => 'dani@appsalon.test', 'tenant_id' => $tenantId],
            [
                'tenant_id' => $tenantId,
                'nombre' => 'Barber Dani',
                'apellido' => '',
                'telefono' => '+52 1 631 248 7987',
                'password' => env('BARBER_DANI_PASSWORD', 'barberdani123'),
                'admin' => true,
                'rol' => 'admin',
                'es_barbero' => true,
                'especialidad' => 'Dueño & Master Barber · Fade, Corte Clásico y Barba',
                'activo' => true,
                'confirmado' => true,
                'token' => null,
            ]
        );
    }
}
