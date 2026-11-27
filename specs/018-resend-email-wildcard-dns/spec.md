# Spec 018: Correos Transaccionales vía Resend API + Wildcard DNS Multi-Tenant

## 1. Objetivo
Habilitar envío real de correos transaccionales (confirmación de cuenta y recuperación de contraseña) en **Railway Hobby** (donde los puertos SMTP 25/465/587 están bloqueados) mediante la **API HTTP de Resend** (plan gratuito: 3,000 correos/mes por puerto 443) y preparar el enrutamiento para **subdominios Wildcard (`*.tudominio.com`)** y dominios personalizados por barbería.

## 2. Alcance Funcional
1. **Transporte HTTP Nativo de Resend (`App\Mail\Transports\ResendHttpTransport`):**
   - Implementa `Symfony\Component\Mailer\Transport\AbstractTransport` usando `Illuminate\Support\Facades\Http` contra `https://api.resend.com/emails` (cero paquetes Composer extra).
   - Registrado en `AppServiceProvider` para el mailer `resend` (`MAIL_MAILER=resend`, `RESEND_KEY=re_...`).
   - Remitente dinámico por barbería: el `From` conserva el dominio verificado en `MAIL_FROM_ADDRESS` pero usa el nombre del tenant activo (ej. `Kingsman Barber Club <citas@tudominio.com>`).
   - Respaldo seguro: si falta `RESEND_KEY`, registra advertencia en `BitacoraService` / `Log` sin romper el flujo.
2. **Wildcard DNS (`APP_BASE_DOMAIN`) y URL Pública por Tenant:**
   - Variable `APP_BASE_DOMAIN` (ej. `tuapp.com`) en `config/app.php` y `.env.example`.
   - `ResolveTenant` extrae el subdominio respecto a `APP_BASE_DOMAIN` cuando está definido.
   - `Tenant::publicUrl()` calcula la URL pública real de cada barbería (`https://{dominio_custom}` → `https://{slug}.{APP_BASE_DOMAIN}` → `/?tenant={slug}` en local).
   - En `/super-admin`, cada tarjeta muestra su URL pública con botón de **copiar enlace**.
3. **Prueba de Correo en 1 Clic desde `/super-admin`:**
   - Endpoint `POST /super-admin/correo-prueba` para que el Super-Admin valide su `RESEND_KEY` y dominio verificado desde la interfaz.

## 3. Guía Rápida de Producción (Railway + Resend + DNS)
1. Crear cuenta gratuita en Resend, verificar dominio (registros DKIM/SPF) y generar `RESEND_KEY`.
2. En Railway (`dannys-barbershop` → `web` → Variables):
   - `MAIL_MAILER=resend`
   - `RESEND_KEY=re_...`
   - `MAIL_FROM_ADDRESS=citas@tudominio.com`
   - `APP_BASE_DOMAIN=tudominio.com`
3. En tu proveedor DNS (Cloudflare/Namecheap): agregar `CNAME * -> <target de Railway>` y añadir `*.tudominio.com` en Railway Custom Domains.
