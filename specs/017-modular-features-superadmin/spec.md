# Spec 017: Modularidad por Planes (Feature Flags) y Panel Super-Admin SaaS

## 1. Objetivo
Permitir comercializar la plataforma Multi-Tenant en planes diferenciados (**Anual \$5,500 MXN**, **Mensual \$600 + \$300 MXN mantenimiento**, o **Trial**) activando o desactivando módulos por barbería sin duplicar código, junto con un panel exclusivo **`/super-admin`** para dar de alta nuevas barberías en menos de 60 segundos, configurar sus datos bancarios/branding y suspender o reactivar suscripciones con un clic.

## 2. Alcance Funcional
1. **Gestor de Módulos (`App\Services\FeatureManager`):**
   - 7 módulos configurables por tenant (`pagos_online`, `spei`, `multi_barbero`, `citas_familiares`, `visagismo`, `crm_clientes`, `dominio_propio`).
   - Defaults automáticos por plan (`trial`, `mensual`, `anual`) + overrides individuales en `tenants.configuracion_extra['features']` (cero consultas extra por request).
   - Middleware `feature:{clave}` (`EnsureFeatureEnabled`) protegiendo rutas de módulos opcionales (`/barberos*`, `/clientes*`).
   - Prop compartida `features` en `HandleInertiaRequests` + hook React `useFeature(clave)` para ocultar controles en UI cuando un módulo está desactivado.
2. **Panel `/super-admin` (Exclusivo Super-Admin Técnico):**
   - Protegido con `['auth', 'bitacora_admin']` (`admin = true && !es_barbero`): invisible e inaccesible para dueños de barberías como Dani.
   - **Dashboard (`/super-admin`):** KPIs globales (total barberías, activas, plan anual/mensual, citas globales), listado de barberías con estado, vencimiento, métricas y botón rápido Activar/Suspender.
   - **Alta Rápida (`/super-admin/barberias/crear`):** Crea en una transacción: `Tenant`, usuario Dueño/Admin (`es_barbero = true`), 7 horarios laborales base y (opcional) 4 servicios iniciales.
   - **Edición y Módulos (`/super-admin/barberias/{tenant}/editar`):** Edita branding, dominio custom, plan, vencimiento, datos SPEI/WhatsApp/Mercado Pago y toggles de los 7 módulos.

## 3. Criterios de Aceptación
- Danny's BarberShop (Tenant #1, plan anual) conserva todos sus módulos activos sin regresiones.
- Al desactivar un módulo en `/super-admin`, el enlace desaparece del menú y la ruta responde `403`.
- Al suspender una barbería, su URL responde `403` indicando suscripción suspendida.
