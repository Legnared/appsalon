# Tareas 018: Resend API + Wildcard DNS

- [x] **T018.1:** Documentar `spec.md`, `plan.md` y `tasks.md` en `specs/018-resend-email-wildcard-dns/`.
- [x] **T018.2:** Crear `ResendHttpTransport` y registrarlo en `AppServiceProvider`, actualizando `ConfirmarCuentaMail` y `ReestablecerPasswordMail` con remitente dinámico por tenant.
- [x] **T018.3:** Agregar `APP_BASE_DOMAIN` (`config/app.php`, `.env.example`), `Tenant::publicUrl()` y soporte wildcard en `ResolveTenant`.
- [x] **T018.4:** Agregar URL pública copiable y botón **Enviar correo de prueba** en `SuperAdminTenantController`, `routes/web.php` y `SuperAdmin/Index.jsx`.
- [x] **T018.5:** Validar sintaxis PHP (`php -l`) y compilación completa (`npm run build`).
