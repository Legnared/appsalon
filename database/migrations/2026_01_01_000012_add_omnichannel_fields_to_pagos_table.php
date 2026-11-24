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
        // Ampliar columnas enum a varchar para soportar métodos omnicanal (mercadopago, transferencia, efectivo, etc.)
        DB::statement("ALTER TABLE pagos MODIFY metodo VARCHAR(30) NOT NULL DEFAULT 'terminal_pos'");
        DB::statement("ALTER TABLE pagos MODIFY estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'");

        Schema::table('pagos', function (Blueprint $table) {
            if (! Schema::hasColumn('pagos', 'tipo_cobro')) {
                $table->string('tipo_cobro', 20)->default('total')->after('metodo');
            }
            if (! Schema::hasColumn('pagos', 'monto_total')) {
                $table->decimal('monto_total', 8, 2)->default(0)->after('monto');
            }
            if (! Schema::hasColumn('pagos', 'monto_pagado')) {
                $table->decimal('monto_pagado', 8, 2)->default(0)->after('monto_total');
            }
            if (! Schema::hasColumn('pagos', 'saldo_pendiente')) {
                $table->decimal('saldo_pendiente', 8, 2)->default(0)->after('monto_pagado');
            }
            if (! Schema::hasColumn('pagos', 'metodo_liquidacion')) {
                $table->string('metodo_liquidacion', 30)->nullable()->after('saldo_pendiente');
            }
            if (! Schema::hasColumn('pagos', 'link_pago')) {
                $table->string('link_pago', 500)->nullable()->after('referencia_bancaria');
            }
        });

        // Inicializar montos en pagos previos si existieran
        DB::table('pagos')->where('monto_total', 0)->update([
            'monto_total' => DB::raw('monto'),
            'monto_pagado' => DB::raw("CASE WHEN estado = 'pagado' THEN monto ELSE 0 END"),
            'saldo_pendiente' => DB::raw("CASE WHEN estado = 'pagado' THEN 0 ELSE monto END"),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $cols = array_filter(
                ['tipo_cobro', 'monto_total', 'monto_pagado', 'saldo_pendiente', 'metodo_liquidacion', 'link_pago'],
                fn (string $c) => Schema::hasColumn('pagos', $c)
            );
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });
    }
};
