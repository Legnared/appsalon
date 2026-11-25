<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tenants')) {
            return;
        }

        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120);
            $table->string('slug', 80)->unique();
            $table->string('dominio_custom', 190)->nullable()->unique();
            $table->boolean('activo')->default(true);
            $table->string('plan', 30)->default('anual'); // trial | mensual | anual
            $table->date('suscripcion_vence_en')->nullable();

            // Branding dinámico
            $table->string('tagline', 120)->nullable();
            $table->string('logo', 255)->nullable();
            $table->string('hero_imagen', 255)->nullable();
            $table->string('color_primario', 20)->default('#d4a259');

            // Contacto y configuración financiera por barbería
            $table->string('whatsapp_negocio', 30)->nullable();
            $table->string('payment_driver', 30)->default('sandbox'); // sandbox | mercadopago | bank_api
            $table->string('moneda', 10)->default('MXN');
            $table->string('anticipo_tipo', 20)->default('fijo'); // fijo | porcentaje
            $table->decimal('anticipo_valor', 8, 2)->default(100.00);
            $table->string('spei_banco', 100)->nullable();
            $table->string('spei_titular', 120)->nullable();
            $table->string('spei_clabe', 30)->nullable();

            // Credenciales cifradas de Mercado Pago por barbería
            $table->text('mercadopago_access_token')->nullable();
            $table->text('mercadopago_public_key')->nullable();
            $table->string('mercadopago_point_device_id', 120)->nullable();
            $table->string('mercadopago_webhook_url', 255)->nullable();

            $table->json('configuracion_extra')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
