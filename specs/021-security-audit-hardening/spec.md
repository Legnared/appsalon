# Spec 021: Auditoría de Seguridad Multi-Tenant & Hardening

## 1. Hallazgos Reales de la Auditoría de Código
1. **Aislamiento de Sesión Cross-Tenant (`ResolveTenant`):** Un usuario autenticado en el Tenant A podría intentar navegar al subdominio del Tenant B con su sesión activa sin ser rechazado explícitamente.
2. **Rate Limiting en Autenticación y Correos (`routes/web.php`):** Las rutas `POST /` (login), `POST /crear-cuenta`, `POST /olvide`, `POST /reestablecer` y `POST /api/citas` no tenían `throttle`, exponiendo fuerza bruta y consumo de cuota de Resend.
3. **Verificación de Webhooks Bancarios (`PagoWebhookController`):** `POST /api/webhooks/pagos/{gateway}` no validaba firma/secreto (`X-Webhook-Secret` / `x-signature`) ni registraba intentos rechazados.
4. **Autorización Fina en Liquidación de Pagos (`PagoController`):** Un barbero (staff no-admin) no tenía verificación explícita de que el `Pago` perteneciera a una cita asignada a él ni doble verificación de `tenant_id`.
5. **Tokens Criptográficos y Cabeceras OWASP (`Usuario`, `SecurityHeaders`):** `Usuario::crearToken()` usaba `uniqid()` (predecible por timestamp) en lugar de CSPRNG `random_bytes()`, y faltaban cabeceras HTTP de seguridad (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

## 2. Remediaciones Implementadas
- `App\Http\Middleware\SecurityHeaders` registrado en `bootstrap/app.php`.
- Guardia Cross-Tenant en `ResolveTenant` con cierre de sesión inmediato y alerta en `BitacoraService`.
- `throttle` en login (`10,1`), registro (`5,1`), recuperación (`5,1`), creación de citas (`20,1`) y webhooks (`60,1`).
- Verificación de secreto en `PagoWebhookController` + doble validación de `tenant_id` y `barberoId` en `PagoController`.
- `Usuario::crearToken()` migrado a `bin2hex(random_bytes(7))` (14 chars hex CSPRNG compatible con `varchar(15)`).
