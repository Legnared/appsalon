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
        Schema::table('citas', function (Blueprint $table) {
            if (! Schema::hasColumn('citas', 'para_quien')) {
                $table->string('para_quien', 30)->default('titular')->after('barberoId');
            }
            if (! Schema::hasColumn('citas', 'nombre_beneficiario')) {
                $table->string('nombre_beneficiario', 80)->nullable()->after('para_quien');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            $columns = array_filter(
                ['para_quien', 'nombre_beneficiario'],
                fn (string $col) => Schema::hasColumn('citas', $col)
            );
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
