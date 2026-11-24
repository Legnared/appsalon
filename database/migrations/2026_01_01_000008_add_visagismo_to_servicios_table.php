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
        Schema::table('servicios', function (Blueprint $table) {
            if (! Schema::hasColumn('servicios', 'tipos_rostro')) {
                $table->json('tipos_rostro')->nullable()->after('activo');
            }
            if (! Schema::hasColumn('servicios', 'recomendacion_rostro')) {
                $table->string('recomendacion_rostro', 255)->nullable()->after('tipos_rostro');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicios', function (Blueprint $table) {
            $columns = array_filter(
                ['tipos_rostro', 'recomendacion_rostro'],
                fn (string $col) => Schema::hasColumn('servicios', $col)
            );
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
