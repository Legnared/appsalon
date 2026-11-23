# Plan Técnico 003: Autenticación, Registro, Confirmación y Recuperación

## 1. Archivos a Crear

```text
app/
├── Http/
│   ├── Controllers/
│   │   └── AuthController.php
│   └── Middleware/
│       └── EnsureUserIsAdmin.php
└── Mail/
    ├── ConfirmarCuentaMail.php
    └── ReestablecerPasswordMail.php
resources/
├── views/
│   └── emails/
│       ├── confirmar-cuenta.blade.php
│       └── reestablecer-password.blade.php
└── js/
    └── Pages/
        └── Auth/
            ├── Login.jsx
            ├── CrearCuenta.jsx
            ├── Mensaje.jsx
            ├── ConfirmarCuenta.jsx
            ├── OlvidePassword.jsx
            └── Reestablecer.jsx
```

## 2. Integración con Laravel Wayfinder en Formularios
En cada componente de `Pages/Auth/*.jsx`, las rutas y envíos de formulario usarán las funciones generadas por `@laravel/vite-plugin-wayfinder`:
- `import AuthController from '@/actions/App/Http/Controllers/AuthController';`
- Envío con `useForm` de `@inertiajs/react`: `post(AuthController.login.url())`, `post(AuthController.crear.url())`, etc.
- Enlaces `<Link href={AuthController.showCrear.url()}>` en `.acciones`.
