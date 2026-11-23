<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('citasServicios')) {
            Schema::create('citasServicios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('citaId')
                    ->nullable()
                    ->constrained('citas')
                    ->nullOnDelete()
                    ->nullOnUpdate();
                $table->foreignId('servicioId')
                    ->nullable()
                    ->constrained('servicios')
                    ->nullOnDelete()
                    ->nullOnUpdate();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citasServicios');
    }
};
