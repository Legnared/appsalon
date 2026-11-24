<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('horarios_laborales')) {
            Schema::create('horarios_laborales', function (Blueprint $table) {
                $table->id();
                $table->unsignedTinyInteger('dia_semana')->unique(); // 0=Domingo .. 6=Sábado
                $table->string('nombre_dia', 20);
                $table->boolean('abierto')->default(true);
                $table->time('hora_apertura')->default('10:00:00');
                $table->time('hora_cierre')->default('19:00:00');
                $table->unsignedSmallInteger('intervalo_minutos')->default(60);
            });

            $dias = [
                ['dia_semana' => 1, 'nombre_dia' => 'Lunes', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 2, 'nombre_dia' => 'Martes', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 3, 'nombre_dia' => 'Miércoles', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 4, 'nombre_dia' => 'Jueves', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 5, 'nombre_dia' => 'Viernes', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 6, 'nombre_dia' => 'Sábado', 'abierto' => true, 'hora_apertura' => '10:00:00', 'hora_cierre' => '19:00:00', 'intervalo_minutos' => 60],
                ['dia_semana' => 0, 'nombre_dia' => 'Domingo', 'abierto' => false, 'hora_apertura' => '10:00:00', 'hora_cierre' => '16:00:00', 'intervalo_minutos' => 60],
            ];

            DB::table('horarios_laborales')->insert($dias);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horarios_laborales');
    }
};
