<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CitaController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Cita/Index', [
            'serviciosIniciales' => Servicio::orderBy('id')->get(),
            'hoy' => now()->toDateString(),
        ]);
    }
}
