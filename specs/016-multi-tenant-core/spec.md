# Spec 016: Núcleo Multi-Tenant (Single-DB)

## 1. Objetivo
Transformar el sistema actual de **Danny's BarberShop** en una arquitectura **SaaS Multi-Tenant de Base de Datos Única (Single-DB)** que permita alojar múltiples barberías independientes en el mismo contenedor Docker y base de datos MySQL en Railway, manteniendo **cero regresiones** en la demo en vivo de Danny's BarberShop (Tenant #1).

## 2. Alcance Funcional
1. **Entidad `Tenant` (`tenants`):**
   - Identificación por `slug` (subdominio) y `dominio_custom` opcional.
   - Control de suscripción (`activo`, `plan`: `mensual|anual|trial`, `suscripcion_vence_en`).
   - Branding dinámico por barbería: `nombre`, `tagline`, `logo`, `hero_imagen`, `color_primario`.
   - Configuración financiera y de contacto por barbería: `whatsapp_negocio`, `payment_driver`, `moneda`, `anticipo_tipo`, `anticipo_valor`, `spei_banco`, `spei_titular`, `spei_clabe`, credenciales cifradas de Mercado Pago (`mercadopago_access_token`, `mercadopago_public_key`, `mercadopago_point_device_id`, `mercadopago_webhook_url`).
2. **Aislamiento de Datos (`tenant_id`):**
   - Columnas `tenant_id` (FK → `tenants.id`) en las 6 tablas de negocio: `usuarios`, `servicios`, `citas`, `pagos`, `horarios_laborales`, `bitacora_eventos`.
   - Backfill automático en migración para crear el Tenant #1 (**Danny's BarberShop**) y asignar los datos existentes sin pérdida de información.
   - Índices únicos compuestos: `(tenant_id, dia_semana)` en `horarios_laborales` y `(tenant_id, email)` en `usuarios`.
   - Super-Admin técnico (`tenant_id = null`, `admin = true`, `es_barbero = false`) puede autenticarse en cualquier tenant para soporte y auditoría.
3. **Resolución de Tenant (`ResolveTenant` Middleware):**
   - Resolución por `dominio_custom` exacto → subdominio (`slug`) → fallback al tenant principal activo (garantizando compatibilidad en `localhost` y en el subdominio inicial de Railway).
   - Bloqueo HTTP `403` si el tenant resuelto está suspendido (`activo = false`).
4. **Branding y Pagos Dinámicos:**
   - `TenantContext` inyecta configuración de pagos al `PaymentManager`, `CitaController` y `APIController`.
   - `HandleInertiaRequests` expone el objeto `tenant` a React (`MainLayout`, `AppSidebar`, `MobileTopBar`, `AppLoader`, `app.jsx`) y los correos Blade usan el nombre real del tenant.
   - Subidas de fotos en `ServicioController` y `BarberoController` se guardan bajo `tenants/{tenant_id}/servicios` y `tenants/{tenant_id}/barberos`.

## 3. Criterios de Aceptación
- Toda consulta Eloquent sobre `Servicio`, `Cita`, `Pago`, `HorarioLaboral`, `BitacoraEvento` y `Usuario` queda aislada al `tenant_id` activo.
- Dos barberías distintas pueden tener sus propios horarios (L-D), sus propios correos de clientes, su propia CLABE SPEI, su propio WhatsApp y su propia marca visual.
- La demo actual de **Danny's BarberShop** sigue funcionando idéntica como Tenant #1 sin cambios manuales.
