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
            if (! Schema::hasColumn('servicios', 'descripcion')) {
                $table->text('descripcion')->nullable()->after('precio');
            }
            if (! Schema::hasColumn('servicios', 'imagen')) {
                $table->string('imagen', 255)->nullable()->after('descripcion');
            }
            if (! Schema::hasColumn('servicios', 'duracion_minutos')) {
                $table->unsignedSmallInteger('duracion_minutos')->default(30)->after('imagen');
            }
            if (! Schema::hasColumn('servicios', 'activo')) {
                $table->boolean('activo')->default(true)->after('duracion_minutos');
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
                ['descripcion', 'imagen', 'duracion_minutos', 'activo'],
                fn (string $col) => Schema::hasColumn('servicios', $col)
            );
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
