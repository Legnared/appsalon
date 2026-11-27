<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicios', function (Blueprint $table) {
            if (! Schema::hasColumn('servicios', 'tipo')) {
                $table->string('tipo', 20)->default('servicio')->after('nombre');
            }
            if (! Schema::hasColumn('servicios', 'stock')) {
                $table->unsignedInteger('stock')->nullable()->after('duracion_minutos');
            }
            $table->index(['tenant_id', 'tipo', 'activo'], 'servicios_tenant_tipo_activo_idx');
        });
    }

    public function down(): void
    {
        Schema::table('servicios', function (Blueprint $table) {
            $table->dropIndex('servicios_tenant_tipo_activo_idx');
            if (Schema::hasColumn('servicios', 'stock')) {
                $table->dropColumn('stock');
            }
            if (Schema::hasColumn('servicios', 'tipo')) {
                $table->dropColumn('tipo');
            }
        });
    }
};
