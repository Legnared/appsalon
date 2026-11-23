<?php

namespace Database\Seeders;

use App\Models\Servicio;
use Illuminate\Database\Seeder;

class ServicioSeeder extends Seeder
{
    /**
     * Catálogo exacto de 11 servicios de appsalon_mvc.sql.
     */
    public function run(): void
    {
        $servicios = [
            ['id' => 1, 'nombre' => 'Corte de Cabello Mujer ACTUALIZADO', 'precio' => 120.00],
            ['id' => 2, 'nombre' => 'Corte de Cabello Hombre', 'precio' => 80.00],
            ['id' => 3, 'nombre' => 'Corte de Cabello Niño', 'precio' => 60.00],
            ['id' => 4, 'nombre' => 'Peinado Mujer', 'precio' => 80.00],
            ['id' => 5, 'nombre' => 'Peinado Hombre', 'precio' => 60.00],
            ['id' => 6, 'nombre' => 'Peinado Niño', 'precio' => 60.00],
            ['id' => 7, 'nombre' => 'Corte de Barba', 'precio' => 60.00],
            ['id' => 8, 'nombre' => 'Tinte Mujer', 'precio' => 300.00],
            ['id' => 9, 'nombre' => 'Uñas', 'precio' => 400.00],
            ['id' => 10, 'nombre' => 'Lavado de Cabello', 'precio' => 50.00],
            ['id' => 11, 'nombre' => 'Tratamiento Capilar', 'precio' => 150.00],
        ];

        foreach ($servicios as $servicio) {
            Servicio::updateOrCreate(
                ['id' => $servicio['id']],
                [
                    'nombre' => $servicio['nombre'],
                    'precio' => $servicio['precio'],
                ]
            );
        }
    }
}
