<?php

namespace App\Http\Controllers;

use App\Mail\ConfirmarCuentaMail;
use App\Mail\ReestablecerPasswordMail;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'El email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'password.required' => 'El Password es Obligatorio',
        ]);

        $usuario = Usuario::where('email', $validated['email'])->first();

        if (! $usuario) {
            BitacoraService::registrar(
                modulo: 'autenticacion',
                accion: 'login_fallido',
                descripcion: "Intento de acceso con email no registrado: {$validated['email']}.",
                detalles: ['email' => $validated['email'], 'motivo' => 'usuario_no_encontrado', 'actor_label' => $validated['email'], 'actor_rol' => 'visitante'],
                nivel: 'alerta'
            );

            return back()->withErrors([
                'email' => 'Usuario no encontrado',
            ])->onlyInput('email');
        }

        if (! Hash::check($validated['password'], $usuario->password) || ! $usuario->confirmado) {
            BitacoraService::registrar(
                modulo: 'autenticacion',
                accion: 'login_fallido',
                descripcion: "Acceso rechazado para {$usuario->email} (password incorrecto o cuenta sin confirmar).",
                detalles: ['email' => $usuario->email, 'confirmado' => (bool) $usuario->confirmado],
                nivel: 'alerta',
                entidadTipo: 'Usuario',
                entidadId: $usuario->id,
                actor: $usuario
            );

            return back()->withErrors([
                'password' => 'Password Incorrecto o tu cuenta no ha sido confirmada',
            ])->onlyInput('email');
        }

        Auth::login($usuario);
        $request->session()->regenerate();

        BitacoraService::registrar(
            modulo: 'autenticacion',
            accion: 'login_exitoso',
            descripcion: "Inicio de sesión de {$usuario->nombre_completo} ({$usuario->email}).",
            detalles: ['email' => $usuario->email, 'rol' => $usuario->rol],
            nivel: 'info',
            entidadTipo: 'Usuario',
            entidadId: $usuario->id,
            actor: $usuario
        );

        if ($usuario->esAdmin() || $usuario->esBarbero()) {
            return redirect('/admin');
        }

        return redirect('/cita');
    }

    public function logout(Request $request): RedirectResponse
    {
        $usuario = Auth::user();
        if ($usuario instanceof Usuario) {
            BitacoraService::registrar(
                modulo: 'autenticacion',
                accion: 'logout',
                descripcion: "Cierre de sesión de {$usuario->nombre_completo}.",
                detalles: ['email' => $usuario->email],
                nivel: 'info',
                entidadTipo: 'Usuario',
                entidadId: $usuario->id,
                actor: $usuario
            );
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function showCrear(): Response
    {
        return Inertia::render('Auth/CrearCuenta');
    }

    public function crear(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:60'],
            'apellido' => ['required', 'string', 'max:60'],
            'telefono' => ['nullable', 'string', 'max:25'],
            'email' => ['required', 'email', 'max:60'],
            'password' => ['required', 'min:6'],
        ], [
            'nombre.required' => 'El Nombre es Obligatorio',
            'apellido.required' => 'El Apellido es Obligatorio',
            'email.required' => 'El Email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
            'password.required' => 'El Password es Obligatorio',
            'password.min' => 'El password debe contener al menos 6 caracteres',
        ]);

        if (Usuario::where('email', $validated['email'])->exists()) {
            return back()->withErrors([
                'email' => 'El Usuario ya esta registrado',
            ])->withInput($request->except('password'));
        }

        $usuario = new Usuario([
            'nombre' => $validated['nombre'],
            'apellido' => $validated['apellido'],
            'telefono' => $validated['telefono'] ?? '',
            'email' => $validated['email'],
            'password' => $validated['password'],
            'admin' => false,
            'confirmado' => false,
        ]);

        $usuario->crearToken();
        $usuario->save();

        Mail::to($usuario->email)->send(
            new ConfirmarCuentaMail($usuario->nombre, $usuario->token)
        );

        return redirect('/mensaje');
    }

    public function mensaje(): Response
    {
        return Inertia::render('Auth/Mensaje');
    }

    public function confirmar(Request $request): Response
    {
        $token = (string) $request->query('token', '');
        $alertas = [];

        $usuario = $token !== '' ? Usuario::where('token', $token)->first() : null;

        if (! $usuario) {
            $alertas['error'][] = 'Token No Válido';
        } else {
            $usuario->confirmado = true;
            $usuario->token = null;
            $usuario->save();
            $alertas['exito'][] = 'Cuenta Comprobada Correctamente';
        }

        return Inertia::render('Auth/ConfirmarCuenta', [
            'alertas' => $alertas,
        ]);
    }

    public function showOlvide(): Response
    {
        return Inertia::render('Auth/OlvidePassword');
    }

    public function olvide(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'El email es Obligatorio',
            'email.email' => 'Dirección de correo electrónico inválida',
        ]);

        $usuario = Usuario::where('email', $validated['email'])->first();

        if ($usuario && $usuario->confirmado) {
            $usuario->crearToken();
            $usuario->save();

            Mail::to($usuario->email)->send(
                new ReestablecerPasswordMail($usuario->nombre, $usuario->token)
            );

            return back()->with('exito', 'Revisa tu email');
        }

        return back()->withErrors([
            'email' => 'El Usuario no existe o no esta confirmado',
        ]);
    }

    public function showRecuperar(Request $request): Response
    {
        $token = (string) $request->query('token', '');
        $alertas = [];
        $error = false;

        if ($token === '') {
            $alertas['error'][] = 'Token no recibido o está vacío';
            $error = true;
        } else {
            $usuario = Usuario::where('token', $token)->first();

            if (! $usuario) {
                $alertas['error'][] = 'Token No Válido';
                $error = true;
            }
        }

        return Inertia::render('Auth/Reestablecer', [
            'alertas' => $alertas,
            'error' => $error,
            'token' => $token,
        ]);
    }

    public function recuperar(Request $request): RedirectResponse
    {
        $token = (string) ($request->query('token') ?? $request->input('token', ''));

        if ($token === '') {
            return back()->withErrors([
                'token' => 'Token no recibido o está vacío',
            ]);
        }

        $usuario = Usuario::where('token', $token)->first();

        if (! $usuario) {
            return back()->withErrors([
                'token' => 'Token No Válido',
            ]);
        }

        $validated = $request->validate([
            'password' => ['required', 'min:6'],
        ], [
            'password.required' => 'El Password es obligatorio',
            'password.min' => 'El Password debe tener al menos 6 caracteres',
        ]);

        $usuario->password = $validated['password'];
        $usuario->token = null;
        $usuario->save();

        return redirect('/')->with('exito', 'Password actualizado correctamente');
    }
}
