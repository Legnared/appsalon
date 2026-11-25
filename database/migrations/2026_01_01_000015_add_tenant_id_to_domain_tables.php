<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const TABLES = [
        'usuarios',
        'servicios',
        'citas',
        'pagos',
        'horarios_laborales',
        'bitacora_eventos',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('tenants')) {
            return;
        }

        // 1. Asegurar Tenant #1 ("Danny's BarberShop") con la configuración actual del entorno
        $defaultTenantId = DB::table('tenants')->orderBy('id')->value('id');

        if (! $defaultTenantId) {
            $appUrlHost = parse_url((string) config('app.url', ''), PHP_URL_HOST);
            $dominioCustom = ($appUrlHost && ! in_array(strtolower($appUrlHost), ['localhost', '127.0.0.1'], true))
                ? strtolower($appUrlHost)
                : null;

            $defaultTenantId = DB::table('tenants')->insertGetId([
                'nombre' => (string) config('app.name', "Danny's BarberShop"),
                'slug' => 'dannys',
                'dominio_custom' => $dominioCustom,
                'activo' => true,
                'plan' => 'anual',
                'tagline' => 'Estilo & Precisión',
                'logo' => '/img/icono.png',
                'hero_imagen' => '/img/1.webp',
                'color_primario' => '#d4a259',
                'whatsapp_negocio' => (string) config('payments.whatsapp_negocio', '5216312487987'),
                'payment_driver' => (string) config('payments.default', 'sandbox'),
                'moneda' => (string) config('payments.currency', 'MXN'),
                'anticipo_tipo' => (string) config('payments.anticipo.tipo', 'fijo'),
                'anticipo_valor' => (float) config('payments.anticipo.valor', 100),
                'spei_banco' => (string) config('payments.spei.banco', 'Mercado Pago / STP'),
                'spei_titular' => (string) config('payments.spei.titular', 'Barber Dani'),
                'spei_clabe' => (string) config('payments.spei.clabe', '722969010000000000'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Agregar tenant_id a las 6 tablas de negocio
        foreach (self::TABLES as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('tenant_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('tenants')
                    ->nullOnDelete();
                $table->index('tenant_id');
            });
        }

        // 3. Backfill automático a Tenant #1 (conservando Super-Admin técnico con tenant_id = null)
        if (Schema::hasTable('usuarios') && Schema::hasColumn('usuarios', 'tenant_id')) {
            DB::table('usuarios')
                ->whereNull('tenant_id')
                ->where(function ($q) {
                    $q->where('admin', '!=', 1)
                        ->orWhereNull('admin')
                        ->orWhere('es_barbero', 1);
                })
                ->update(['tenant_id' => $defaultTenantId]);
        }

        foreach (['servicios', 'citas', 'pagos', 'horarios_laborales', 'bitacora_eventos'] as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                DB::table($tableName)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenantId]);
            }
        }

        // 4. Reemplazar índices únicos globales por índices compuestos (tenant_id, ...)
        $this->swapUniqueIndex('horarios_laborales', 'horarios_laborales_dia_semana_unique', ['tenant_id', 'dia_semana'], 'horarios_tenant_dia_unique');
        $this->swapUniqueIndex('usuarios', 'usuarios_email_unique', ['tenant_id', 'email'], 'usuarios_tenant_email_unique');
    }

    public function down(): void
    {
        $this->restoreUniqueIndex('usuarios', 'usuarios_tenant_email_unique', ['email'], 'usuarios_email_unique');
        $this->restoreUniqueIndex('horarios_laborales', 'horarios_tenant_dia_unique', ['dia_semana'], 'horarios_laborales_dia_semana_unique');

        foreach (array_reverse(self::TABLES) as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('tenant_id');
                });
            }
        }
    }

    private function swapUniqueIndex(string $tableName, string $oldIndex, array $newColumns, string $newIndex): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($oldIndex) {
                $table->dropUnique($oldIndex);
            });
        } catch (\Throwable) {
            // El índice legado ya pudo haber sido eliminado manualmente o renombrado.
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($newColumns, $newIndex) {
                $table->unique($newColumns, $newIndex);
            });
        } catch (\Throwable) {
            // Ya existe el índice compuesto.
        }
    }

    private function restoreUniqueIndex(string $tableName, string $compositeIndex, array $oldColumns, string $oldIndex): void
    {
        if (! Schema::hasTable($tableName)) {
            return;
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($compositeIndex) {
                $table->dropUnique($compositeIndex);
            });
        } catch (\Throwable) {
        }

        try {
            Schema::table($tableName, function (Blueprint $table) use ($oldColumns, $oldIndex) {
                $table->unique($oldColumns, $oldIndex);
            });
        } catch (\Throwable) {
        }
    }
};
