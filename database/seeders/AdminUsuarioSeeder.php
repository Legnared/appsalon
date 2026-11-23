<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;

class AdminUsuarioSeeder extends Seeder
{
    /**
     * Crea o actualiza el usuario administrador inicial (confirmado = 1, admin = 1).
     */
    public function run(): void
    {
        $email = env('INITIAL_ADMIN_EMAIL', 'admin@appsalon.test');
        $password = env('INITIAL_ADMIN_PASSWORD', 'admin123');

        Usuario::updateOrCreate(
            ['email' => $email],
            [
                'nombre' => 'Administrador',
                'apellido' => 'AppSalon',
                'telefono' => '4430000000',
                'password' => $password,
                'admin' => true,
                'confirmado' => true,
                'token' => null,
            ]
        );
    }
}
