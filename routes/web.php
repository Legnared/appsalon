<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\APIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarberoController;
use App\Http\Controllers\BitacoraController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PagoWebhookController;
use App\Http\Controllers\PerfilController;
use App\Http\Controllers\ServicioController;
use App\Http\Controllers\SuperAdminCuentaController;
use App\Http\Controllers\SuperAdminTenantController;
use Illuminate\Support\Facades\Route;

// Iniciar Sesión (con rate limiting anti fuerza bruta)
Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login.attempt');
Route::match(['get', 'post'], '/logout', [AuthController::class, 'logout'])->name('logout');

// Recuperar Password (con rate limiting para proteger cuota Resend)
Route::get('/olvide', [AuthController::class, 'showOlvide'])->name('password.request');
Route::post('/olvide', [AuthController::class, 'olvide'])->middleware('throttle:5,1')->name('password.email');

Route::get('/reestablecer', [AuthController::class, 'showRecuperar'])->name('password.reset');
Route::post('/reestablecer', [AuthController::class, 'recuperar'])->middleware('throttle:5,1')->name('password.update');

// Crear Cuenta y Confirmación
Route::get('/crear-cuenta', [AuthController::class, 'showCrear'])->name('register');
Route::post('/crear-cuenta', [AuthController::class, 'crear'])->middleware('throttle:5,1')->name('register.store');
Route::get('/mensaje', [AuthController::class, 'mensaje'])->name('register.message');
Route::get('/confirmar-cuenta', [AuthController::class, 'confirmar'])->name('register.confirm');

// Área Privada — Citas del Cliente y Mi Perfil
Route::middleware('auth')->group(function () {
    Route::get('/mi-perfil', [PerfilController::class, 'index'])->name('perfil.index');
    Route::post('/mi-perfil', [PerfilController::class, 'actualizar'])->name('perfil.update');

    Route::get('/cita', [CitaController::class, 'index'])->name('cita.index');

    // API de Citas y Servicios
    Route::get('/api/servicios', [APIController::class, 'index'])->name('api.servicios.index');
    Route::get('/api/disponibilidad', [APIController::class, 'disponibilidad'])->name('api.disponibilidad');
    Route::post('/api/citas', [APIController::class, 'guardar'])->middleware('throttle:20,1')->name('api.citas.guardar');
    Route::post('/api/citas/{cita}/reagendar', [APIController::class, 'reagendar'])->middleware('admin')->name('api.citas.reagendar');
    Route::post('/api/eliminar', [APIController::class, 'eliminar'])->middleware('admin')->name('api.citas.eliminar');
    Route::post('/api/pagos/{pago}/terminal', [PagoController::class, 'cobrarEnTerminal'])->middleware('staff')->name('api.pagos.terminal');
});

// Webhook Bancario / Terminal POS (multi-gateway + rate limiting)
Route::post('/api/webhooks/pagos/{gateway}', [PagoWebhookController::class, 'handle'])->middleware('throttle:60,1')->name('api.pagos.webhook');

// Agenda compartida (Admin ve todos / Barbero ve solo sus citas)
Route::middleware(['auth', 'staff'])->group(function () {
    Route::get('/admin', [AdminController::class, 'index'])->name('admin.index');
});

// Panel de Administración Exclusivo Dueño (Servicios, Barberos, Clientes)
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/servicios', [ServicioController::class, 'index'])->name('servicios.index');
    Route::get('/servicios/crear', [ServicioController::class, 'showCrear'])->name('servicios.crear');
    Route::post('/servicios/crear', [ServicioController::class, 'crear'])->name('servicios.store');
    Route::get('/servicios/actualizar', [ServicioController::class, 'showActualizar'])->name('servicios.actualizar');
    Route::post('/servicios/actualizar', [ServicioController::class, 'actualizar'])->name('servicios.update');
    Route::post('/servicios/toggle-activo', [ServicioController::class, 'toggleActivo'])->name('servicios.toggle');
    Route::post('/servicios/eliminar', [ServicioController::class, 'eliminar'])->name('servicios.eliminar');

    // Gestión de Barberos (Spec 009 - Fase 1 · Modular: multi_barbero)
    Route::middleware('feature:multi_barbero')->group(function () {
        Route::get('/barberos', [BarberoController::class, 'index'])->name('barberos.index');
        Route::get('/barberos/crear', [BarberoController::class, 'showCrear'])->name('barberos.crear');
        Route::post('/barberos/crear', [BarberoController::class, 'crear'])->name('barberos.store');
        Route::get('/barberos/actualizar', [BarberoController::class, 'showActualizar'])->name('barberos.actualizar');
        Route::post('/barberos/actualizar', [BarberoController::class, 'actualizar'])->name('barberos.update');
        Route::post('/barberos/toggle-activo', [BarberoController::class, 'toggleActivo'])->name('barberos.toggle');
    });

    // Cartera de Clientes y Prospectos (Spec 009 - Fase 2 · Modular: crm_clientes)
    Route::middleware('feature:crm_clientes')->group(function () {
        Route::get('/clientes', [ClienteController::class, 'index'])->name('clientes.index');
        Route::get('/clientes/crear', [ClienteController::class, 'showCrear'])->name('clientes.crear');
        Route::post('/clientes/crear', [ClienteController::class, 'crear'])->name('clientes.store');
        Route::get('/clientes/actualizar', [ClienteController::class, 'showActualizar'])->name('clientes.actualizar');
        Route::post('/clientes/actualizar', [ClienteController::class, 'actualizar'])->name('clientes.update');
    });

    // Configuración de Horarios Laborales y Ausencias de Barberos (Spec 012 + Spec 022)
    Route::get('/horarios', [HorarioController::class, 'index'])->name('horarios.index');
    Route::post('/horarios', [HorarioController::class, 'actualizar'])->name('horarios.update');
    Route::post('/horarios/ausencias', [HorarioController::class, 'crearAusencia'])->name('horarios.ausencias.store');
    Route::delete('/horarios/ausencias/{ausencia}', [HorarioController::class, 'eliminarAusencia'])->name('horarios.ausencias.destroy');

    // Personalización de Marca, Logo y Portada de la Barbería (Spec 017+)
    Route::get('/mi-marca', [MarcaController::class, 'index'])->name('marca.index');
    Route::post('/mi-marca', [MarcaController::class, 'actualizar'])->name('marca.update');
});

// Exclusivo Admin Técnico / Super-Admin SaaS (NO dueño/barbero) (Spec 014 + Spec 017)
Route::middleware(['auth', 'bitacora_admin'])->group(function () {
    Route::get('/bitacora', [BitacoraController::class, 'index'])->name('bitacora.index');

    Route::get('/super-admin', [SuperAdminTenantController::class, 'index'])->name('superadmin.index');
    Route::get('/super-admin/barberias/crear', [SuperAdminTenantController::class, 'showCrear'])->name('superadmin.tenants.crear');
    Route::post('/super-admin/barberias', [SuperAdminTenantController::class, 'crear'])->name('superadmin.tenants.store');
    Route::get('/super-admin/barberias/{tenant}/editar', [SuperAdminTenantController::class, 'showEditar'])->name('superadmin.tenants.editar');
    Route::put('/super-admin/barberias/{tenant}', [SuperAdminTenantController::class, 'actualizar'])->name('superadmin.tenants.update');
    Route::post('/super-admin/barberias/{tenant}/toggle', [SuperAdminTenantController::class, 'toggleActivo'])->name('superadmin.tenants.toggle');
    Route::get('/super-admin/barberias/{tenant}/previsualizar', [SuperAdminTenantController::class, 'previsualizar'])->name('superadmin.tenants.previsualizar');
    Route::post('/super-admin/correo-prueba', [SuperAdminTenantController::class, 'enviarCorreoPrueba'])->name('superadmin.mail.test');

    Route::get('/super-admin/cuenta-roles', [SuperAdminCuentaController::class, 'index'])->name('superadmin.cuenta.index');
    Route::post('/super-admin/cuenta-roles/perfil', [SuperAdminCuentaController::class, 'actualizarPerfil'])->name('superadmin.cuenta.perfil');
    Route::post('/super-admin/cuenta-roles/usuarios/{usuarioId}/cambiar-password', [SuperAdminCuentaController::class, 'cambiarPasswordUsuario'])->name('superadmin.cuenta.usuario.password');
    Route::post('/super-admin/cuenta-roles/usuarios/{usuarioId}/enviar-reset', [SuperAdminCuentaController::class, 'enviarResetUsuario'])->name('superadmin.cuenta.usuario.reset');
});
