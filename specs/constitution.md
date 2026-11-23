# Constitución del Proyecto — AppSalon (Laravel 12 + Inertia + React + Wayfinder)

Este documento establece los principios arquitectónicos, reglas de negocio innegociables y estándares de calidad bajo la metodología **Spec-Driven Development (Spec Kit)** para la migración de **AppSalon** en `c:\Apache24\htdocs\appsalon`.

---

## 1. Estrategia de Repositorio (Opción A — Reciclaje In-Situ)

1. **Mismo Directorio Raíz:** El proyecto evoluciona directamente en `c:\Apache24\htdocs\appsalon`.
2. **Respaldo Legacy (`_legacy/`):** Antes de inicializar la estructura de Laravel 12 en la raíz, todos los artefactos propietarios del MVC original (`Router.php`, `controllers/`, `models/`, `views/`, `includes/`, `classes/`, `gulpfile.js`, `Procfile`, `public/index.php`) se archivan ordenadamente en `_legacy/` como referencia viva de consulta.
3. **Reciclaje de Activos Originales:**
   - Los estilos SASS originales (`src/scss/**/*.scss`) se migran íntegros a `resources/scss/` para ser compilados nativamente por **Vite**.
   - Las imágenes (`src/img/1.jpg`, `public/build/img/1.webp`, `public/build/img/icono.png`) se conservan en `public/img/` (y/o `resources/img/`).
   - El esquema y datos semilla de `appsalon_mvc.sql` se convierten en migraciones y seeders oficiales de Laravel 12.

---

## 2. Stack Tecnológico Oficial

- **Backend:** PHP 8.2+ / **Laravel 12** (Eloquent ORM, Session Auth, FormRequests, Middlewares, Mailables).
- **Puente Full-Stack:** **Inertia.js v2** (`inertiajs/inertia-laravel` + `@inertiajs/react`).
- **Enrutamiento Tipado Frontend-Backend:** **Laravel Wayfinder** (`laravel/wayfinder` en Composer + `import { wayfinder } from '@laravel/vite-plugin-wayfinder'` en `vite.config.js`).
  - *Regla Wayfinder:* Ningún componente de React debe hardcodear URLs manuales (`'/servicios/crear'`, `'/api/citas'`, etc.) cuando invoque acciones de controladores o formularios de Inertia; se deben importar las acciones/rutas generadas automáticamente por Wayfinder (ej. `import LoginController from '@/actions/App/Http/Controllers/AuthController'`).
- **Frontend:** **React 18+** (Componentes funcionales, Hooks, `useForm` y `router` de `@inertiajs/react`), **SweetAlert2** (`sweetalert2`).
- **Estilos:** **SASS (`dart-sass`)** integrado en Vite (`resources/scss/app.scss`), preservando el diseño CSS Grid + Flexbox original (`.contenedor-app`, `.imagen`, `.app`). **Prohibido introducir TailwindCSS, Bootstrap o librerías UI que alteren la identidad visual original.**
- **Base de Datos:** MySQL (`appsalon_mvc`) con las 4 tablas originales del dominio (`usuarios`, `servicios`, `citas`, `citasServicios`) más la tabla `pagos` para el motor de cobros con tarjeta y terminal POS (`Spec 006`).

---

## 3. Principios Innegociables

### P1. Base Original Fiel + Evolución Controlada por Spec (`Spec 006`)
Se conserva el 100% de las tablas, reglas y flujos del sistema original, y la única ampliación funcional autorizada es el **Motor de Pagos Multi-Banco (Tarjeta en Línea + Terminal POS)** gobernado por `specs/006-payments-cards-and-pos/`. Cualquier mejora técnica (como el uso de **Eloquent**, **FormRequests**, **Laravel Mail**, **Inertia `useForm`**, **Wayfinder** y **PaymentGatewayInterface**) debe mantener la coherencia visual y arquitectónica del sistema.

### P2. Fidelidad Visual 1:1
El DOM renderizado por los componentes React debe respetar la estructura y clases CSS del proyecto original:
- Layout dividido `.contenedor-app` → `.imagen` + `.app`.
- Tipografía Google Fonts `Poppins` (`300`, `700`, `900`), base `html { font-size: 62.5%; }`, fondo `$negro: #1a1b15`, acento `$azul: #0da6f3`, alertas `.alerta.error` (`#cb0000`) y `.alerta.exito` (`#329f00`).

### P3. Reglas de Negocio Intactas
1. **Autenticación y Cuentas:**
   - Registro con `nombre`, `apellido`, `telefono`, `email`, `password` (mínimo 6 caracteres).
   - Generación de `token` (`uniqid()` / 13-15 caracteres) y confirmación por correo (`/confirmar-cuenta?token=...`).
   - Un usuario no confirmado (`confirmado != 1`) no puede iniciar sesión (`"Password Incorrecto o tu cuenta no ha sido confirmada"`).
   - Redirección post-login según rol: `admin == 1` → `/admin`; cliente (`admin == 0`) → `/cita`.
   - Recuperación de contraseña con token por correo (`/olvide` → `/reestablecer?token=...`).
2. **Asistente de Citas (`/cita`):**
   - 3 pasos interactivos con `.tabs` y `.paginacion` (`Anterior` / `Siguiente`).
   - Selección múltiple de servicios con toggle de clase `.seleccionado`.
   - **Regla de Fecha:** Fecha mínima hoy; **prohibido agendar en domingo** (`getUTCDay() === 0` → `"Domingos No Trabajamos, Elije otro día de Lunes a Sábado"`).
   - **Regla de Hora:** Horario permitido de **10:00 a 19:59** (`hora < 10 || hora > 19` → `"Hora No Válida"`).
   - **Resumen:** Validación de datos completos (`"Faltan datos de Servicios, Fecha u Hora"`), desglose de servicios y precios, fecha formateada en español (`es-MX`) y confirmación con `Swal.fire`.
3. **Administración (`/admin` y `/servicios`):**
   - Acceso exclusivo para `admin == 1`.
   - Filtro de citas por fecha (`?fecha=YYYY-MM-DD`) con validación `checkdate`, listado de servicios contratados por cita, cálculo de `Total: $ {total}` y eliminación de citas.
   - CRUD completo de servicios (`/servicios`, `/servicios/crear`, `/servicios/actualizar`, `/servicios/eliminar`) con validación de `nombre` obligatorio y `precio` obligatorio/numérico.

### P4. Flujo de Trabajo Spec Kit
1. Ninguna fase se implementa sin revisar su carpeta en `specs/00X-*/` (`spec.md`, `plan.md`, `tasks.md`).
2. Si durante el desarrollo surge un ajuste con criterio, primero se actualiza la especificación correspondiente en `specs/` y luego se refleja en el código.
3. Cada tarea de `tasks.md` se marca como completada (`[x]`) únicamente después de verificar su funcionamiento.
