<?php

use App\Http\Controllers\AuthController;
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
