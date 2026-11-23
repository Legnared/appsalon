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
        if (! Schema::hasTable('pagos')) {
            Schema::create('pagos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('citaId')
                    ->constrained('citas')
                    ->cascadeOnDelete();
                $table->foreignId('usuarioId')
                    ->nullable()
                    ->constrained('usuarios')
                    ->nullOnDelete();
                $table->decimal('monto', 8, 2);
                $table->string('moneda', 3)->default('MXN');
                $table->enum('metodo', ['tarjeta_online', 'terminal_pos'])->default('terminal_pos');
                $table->string('gateway', 40)->default('sandbox');
                $table->enum('estado', ['pendiente', 'procesando', 'pagado', 'fallido', 'reembolsado'])->default('pendiente');
                $table->string('referencia_bancaria', 100)->nullable();
                $table->string('codigo_autorizacion', 30)->nullable();
                $table->string('ultimos_4', 4)->nullable();
                $table->string('marca_tarjeta', 20)->nullable();
                $table->string('terminal_id', 50)->nullable();
                $table->json('respuesta_payload')->nullable();
                $table->timestamp('pagado_en')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
