# Plan Técnico 001: Fundación Laravel 12 + Inertia + React + Wayfinder

## 1. Arquitectura de Archivos a Crear / Configurar

```text
c:\Apache24\htdocs\appsalon\
├── _legacy/                          # Respaldo íntegro del proyecto PHP 8 MVC original
├── app/
│   └── Http/
│       └── Middleware/
│           └── HandleInertiaRequests.php
├── config/                           # Configuración estándar de Laravel 12
├── public/
│   ├── index.php                     # Entrypoint de Laravel 12
│   └── img/
│       ├── 1.jpg
│       ├── 1.webp
│       └── icono.png
├── resources/
│   ├── views/
│   │   └── app.blade.php             # Plantilla raíz de Inertia
│   ├── scss/
│   │   ├── app.scss
│   │   ├── base/                     # _normalize, _variables, _mixins, _globales, _tipografia
│   │   ├── layout/                   # _UI, _cita, _servicios, _resumen, _admin
│   │   └── componentes/              # _formulario, _botones, _acciones, _alertas, _tabs, _paginacion
│   └── js/
│       ├── app.jsx                   # Bootstrap de Inertia + React
│       ├── actions/                  # Autogenerado por @laravel/vite-plugin-wayfinder
│       ├── routes/                   # Autogenerado por @laravel/vite-plugin-wayfinder
│       ├── Layouts/
│       │   └── MainLayout.jsx
│       └── Components/
│           ├── Alertas.jsx
│           ├── Barra.jsx
│           └── ServicioFormulario.jsx
├── vite.config.js
├── composer.json
└── package.json
```

## 2. Configuración Clave de `vite.config.js` con Wayfinder

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/scss/app.scss', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
```

## 3. Datos Compartidos en `HandleInertiaRequests`
El middleware `HandleInertiaRequests` compartirá en todas las respuestas de Inertia:
```php
'auth' => [
    'user' => $request->user() ? [
        'id' => $request->user()->id,
        'nombre' => $request->user()->nombre,
        'apellido' => $request->user()->apellido,
        'nombreCompleto' => trim($request->user()->nombre . ' ' . $request->user()->apellido),
        'email' => $request->user()->email,
        'admin' => (bool) $request->user()->admin,
    ] : null,
],
'flash' => [
    'exito' => fn () => $request->session()->get('exito'),
    'error' => fn () => $request->session()->get('error'),
],
```
