<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bitacora_eventos', function (Blueprint $table) {
            $table->id();
            $table->string('modulo', 40)->index();
            $table->string('accion', 60)->index();
            $table->string('nivel', 20)->default('info')->index();
            $table->string('descripcion', 255);
            $table->foreignId('usuario_id')
                ->nullable()
                ->constrained('usuarios')
                ->nullOnDelete();
            $table->string('usuario_nombre', 120)->nullable();
            $table->string('usuario_rol', 30)->nullable()->index();
            $table->string('entidad_tipo', 60)->nullable();
            $table->unsignedBigInteger('entidad_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->json('detalles')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bitacora_eventos');
    }
};
