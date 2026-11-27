# Plan 018: Resend HTTP API + Wildcard DNS

1. `app/Mail/Transports/ResendHttpTransport.php`: transporte HTTP nativo sobre `Http::withToken(...)` hacia `https://api.resend.com/emails`.
2. `app/Providers/AppServiceProvider.php`: registrar `Mail::extend('resend', ...)` cuando no esté instalado el SDK externo.
3. `app/Mail/ConfirmarCuentaMail.php` & `ReestablecerPasswordMail.php`: `from` dinámico con el nombre del tenant (`$this->marca`).
4. `config/app.php` & `.env.example`: agregar `base_domain` (`APP_BASE_DOMAIN`) y `RESEND_KEY`.
5. `app/Models/Tenant.php` & `app/Http/Middleware/ResolveTenant.php`: `publicUrl()` y extracción precisa de subdominio con `APP_BASE_DOMAIN`.
6. `app/Http/Controllers/SuperAdminTenantController.php`, `routes/web.php` & `resources/js/Pages/SuperAdmin/Index.jsx`: mostrar URL pública copiable por barbería + botón de envío de correo de prueba (`POST /super-admin/correo-prueba`).
7. Validación: `php -l` y `npm run build`.
