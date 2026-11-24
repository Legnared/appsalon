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
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('telefono', 25)->nullable()->change();

            if (! Schema::hasColumn('usuarios', 'es_barbero')) {
                $table->boolean('es_barbero')->default(false)->after('rol');
            }
        });

        DB::table('usuarios')->where('rol', 'barbero')->update(['es_barbero' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            if (Schema::hasColumn('usuarios', 'es_barbero')) {
                $table->dropColumn('es_barbero');
            }
            $table->string('telefono', 10)->nullable()->change();
        });
    }
};
