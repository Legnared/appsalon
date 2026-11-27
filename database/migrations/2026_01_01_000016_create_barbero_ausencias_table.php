<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('barbero_ausencias')) {
            return;
        }

        Schema::create('barbero_ausencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('barbero_id')->constrained('usuarios')->cascadeOnDelete();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('motivo', 140)->nullable();
            $table->boolean('visible_clientes')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'barbero_id', 'fecha_inicio', 'fecha_fin'], 'ausencias_tenant_barbero_fechas_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbero_ausencias');
    }
};
