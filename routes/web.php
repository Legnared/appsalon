<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\APIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarberoController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PagoWebhookController;
use App\Http\Controllers\ServicioController;
use Illuminate\Support\Facades\Route;

// Iniciar Sesión
Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/', [AuthController::class, 'login'])->name('login.attempt');
Route::match(['get', 'post'], '/logout', [AuthController::class, 'logout'])->name('logout');

// Recuperar Password
Route::get('/olvide', [AuthController::class, 'showOlvide'])->name('password.request');
Route::post('/olvide', [AuthController::class, 'olvide'])->name('password.email');

Route::get('/reestablecer', [AuthController::class, 'showRecuperar'])->name('password.reset');
Route::post('/reestablecer', [AuthController::class, 'recuperar'])->name('password.update');

// Crear Cuenta y Confirmación
Route::get('/crear-cuenta', [AuthController::class, 'showCrear'])->name('register');
Route::post('/crear-cuenta', [AuthController::class, 'crear'])->name('register.store');
Route::get('/mensaje', [AuthController::class, 'mensaje'])->name('register.message');
Route::get('/confirmar-cuenta', [AuthController::class, 'confirmar'])->name('register.confirm');

// Área Privada — Citas del Cliente
Route::middleware('auth')->group(function () {
    Route::get('/cita', [CitaController::class, 'index'])->name('cita.index');

    // API de Citas y Servicios
    Route::get('/api/servicios', [APIController::class, 'index'])->name('api.servicios.index');
    Route::get('/api/disponibilidad', [APIController::class, 'disponibilidad'])->name('api.disponibilidad');
    Route::post('/api/citas', [APIController::class, 'guardar'])->name('api.citas.guardar');
    Route::post('/api/citas/{cita}/reagendar', [APIController::class, 'reagendar'])->middleware('admin')->name('api.citas.reagendar');
    Route::post('/api/eliminar', [APIController::class, 'eliminar'])->middleware('admin')->name('api.citas.eliminar');
    Route::post('/api/pagos/{pago}/terminal', [PagoController::class, 'cobrarEnTerminal'])->middleware('staff')->name('api.pagos.terminal');
});

// Webhook Bancario / Terminal POS (multi-gateway)
Route::post('/api/webhooks/pagos/{gateway}', [PagoWebhookController::class, 'handle'])->name('api.pagos.webhook');

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

    // Gestión de Barberos (Spec 009 - Fase 1)
    Route::get('/barberos', [BarberoController::class, 'index'])->name('barberos.index');
    Route::get('/barberos/crear', [BarberoController::class, 'showCrear'])->name('barberos.crear');
    Route::post('/barberos/crear', [BarberoController::class, 'crear'])->name('barberos.store');
    Route::get('/barberos/actualizar', [BarberoController::class, 'showActualizar'])->name('barberos.actualizar');
    Route::post('/barberos/actualizar', [BarberoController::class, 'actualizar'])->name('barberos.update');
    Route::post('/barberos/toggle-activo', [BarberoController::class, 'toggleActivo'])->name('barberos.toggle');

    // Cartera de Clientes y Prospectos (Spec 009 - Fase 2)
    Route::get('/clientes', [ClienteController::class, 'index'])->name('clientes.index');
    Route::get('/clientes/crear', [ClienteController::class, 'showCrear'])->name('clientes.crear');
    Route::post('/clientes/crear', [ClienteController::class, 'crear'])->name('clientes.store');
    Route::get('/clientes/actualizar', [ClienteController::class, 'showActualizar'])->name('clientes.actualizar');
    Route::post('/clientes/actualizar', [ClienteController::class, 'actualizar'])->name('clientes.update');

    // Configuración de Horarios Laborales (Spec 012)
    Route::get('/horarios', [HorarioController::class, 'index'])->name('horarios.index');
    Route::post('/horarios', [HorarioController::class, 'actualizar'])->name('horarios.update');
});
