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
            if (! Schema::hasColumn('usuarios', 'rol')) {
                $table->enum('rol', ['admin', 'barbero', 'cliente'])->default('cliente')->after('admin');
            }
            if (! Schema::hasColumn('usuarios', 'especialidad')) {
                $table->string('especialidad', 120)->nullable()->after('rol');
            }
            if (! Schema::hasColumn('usuarios', 'foto')) {
                $table->string('foto', 255)->nullable()->after('especialidad');
            }
            if (! Schema::hasColumn('usuarios', 'activo')) {
                $table->boolean('activo')->default(true)->after('foto');
            }
            if (! Schema::hasColumn('usuarios', 'barbero_id')) {
                $table->foreignId('barbero_id')
                    ->nullable()
                    ->after('activo')
                    ->constrained('usuarios')
                    ->nullOnDelete();
            }
        });

        // Sincronizar administradores existentes con el rol 'admin'
        DB::table('usuarios')->where('admin', true)->update(['rol' => 'admin']);

        Schema::table('citas', function (Blueprint $table) {
            if (! Schema::hasColumn('citas', 'barberoId')) {
                $table->foreignId('barberoId')
                    ->nullable()
                    ->after('usuarioId')
                    ->constrained('usuarios')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('citas', function (Blueprint $table) {
            if (Schema::hasColumn('citas', 'barberoId')) {
                $table->dropConstrainedForeignId('barberoId');
            }
        });

        Schema::table('usuarios', function (Blueprint $table) {
            if (Schema::hasColumn('usuarios', 'barbero_id')) {
                $table->dropConstrainedForeignId('barbero_id');
            }
            $columns = array_filter(
                ['rol', 'especialidad', 'foto', 'activo'],
                fn (string $col) => Schema::hasColumn('usuarios', $col)
            );
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
