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
        if (! Schema::hasTable('usuarios')) {
            Schema::create('usuarios', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 60)->nullable();
                $table->string('apellido', 60)->nullable();
                $table->string('email', 60)->nullable()->unique();
                $table->string('password', 60)->nullable();
                $table->string('telefono', 10)->nullable();
                $table->boolean('admin')->nullable()->default(false);
                $table->boolean('confirmado')->nullable()->default(false);
                $table->string('token', 15)->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
