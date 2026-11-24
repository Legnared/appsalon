# AGENTS.md — Migración AppSalon (PHP 8 MVC → Laravel 12 + Inertia.js + React)

Guía integral de arquitectura, inventario técnico y plan de migración del proyecto **AppSalon** ubicado en `c:\Apache24\htdocs\appsalon`.
Todo lo documentado en este archivo se deriva **exclusivamente de la evidencia real en el código fuente del proyecto original** (sin funcionalidades inventadas).

---

## 1. Propósito y Alcance

**Objetivo:** Migrar el sistema **AppSalon (Barbería / Salón de Belleza)** desde su arquitectura original en PHP 8 MVC propietario hacia **Laravel 12 con React e Inertia.js**, preservando íntegramente su interfaz gráfica (SASS, CSS Grid, Flexbox, diseño dividido `.contenedor-app`), reglas de negocio, estructura de datos y flujos de usuario.

### Stack Origen (Evidencia en Repositorio)
- **Backend:** PHP 8 con patrón MVC propio (`Router.php`, `models/ActiveRecord.php`, `controllers/*`, `classes/Email.php`).
- **Base de Datos:** MySQL / InnoDB (`appsalon_mvc.sql`, conexión `mysqli` en `includes/database.php`).
- **Dependencias PHP (`composer.json`):** `phpmailer/phpmailer` (`^6.9`), `vlucas/phpdotenv` (`^5.4`).
- **Frontend y Estilos (`package.json`, `gulpfile.js`):** SASS (`src/scss/**/*.scss`), Vanilla JS (`src/js/app.js`, `src/js/buscador.js`), SweetAlert2 (`//cdn.jsdelivr.net/npm/sweetalert2@11`), fuente Google Fonts `Poppins` (pesos `300`, `700`, `900`).

### Stack Destino (Estrategia Opción A: Reciclaje In-Situ con Spec Kit)
- **Estrategia de Repositorio (Opción A):** Se mantiene el proyecto en `c:\Apache24\htdocs\appsalon`, respaldando el código PHP MVC propietario dentro de `_legacy/` y reciclando directamente `src/scss/` → `resources/scss/`, `src/img/` → `public/img/` y `appsalon_mvc.sql` → migraciones/seeders.
- **Backend:** Laravel 12 (Eloquent ORM, Autenticación/Sesiones, Middleware de roles, FormRequests / Validaciones, Laravel Mail).
- **Puente Full-Stack:** Inertia.js (`@inertiajs/react` + `inertiajs/inertia-laravel`).
- **Conexión Tipada de Rutas:** **Laravel Wayfinder** (`laravel/wayfinder` + `import { wayfinder } from '@laravel/vite-plugin-wayfinder'` en `vite.config.js`), generando acciones y rutas tipadas en `resources/js/actions` y `resources/js/routes`.
- **Frontend:** React 18+ (Componentes funcionales y hooks), Vite (compilación nativa de SASS `app.scss` y assets), `sweetalert2`.
- **Base de Datos:** MySQL (migraciones y seeders de Laravel 12 replicando las 4 tablas y el catálogo inicial de servicios de `appsalon_mvc.sql`).
- **Metodología de Trabajo:** **Spec-Driven Development (Spec Kit)** gobernado desde el directorio `specs/` (`constitution.md` y módulos `001` a `005`).

---

## 2. Inventario Exacto de Base de Datos (`appsalon_mvc.sql`)

El esquema original consta únicamente de **4 tablas** en la base de datos `appsalon_mvc`:

### 2.1 Tabla `usuarios`
| Columna | Tipo Original | Detalles / Reglas en Código (`models/Usuario.php`) | Equivalente en Migración Laravel 12 |
| :--- | :--- | :--- | :--- |
| `id` | `int NOT NULL AUTO_INCREMENT` | PK | `$table->id()` |
| `nombre` | `varchar(60) DEFAULT NULL` | Obligatorio en registro | `$table->string('nombre', 60)` |
| `apellido` | `varchar(60) DEFAULT NULL` | Obligatorio en registro | `$table->string('apellido', 60)` |
| `email` | `varchar(30) DEFAULT NULL` | Obligatorio, único (`existeUsuario()`), formato email | `$table->string('email', 60)->unique()` *(ampliar o conservar límite compatible)* |
| `password` | `varchar(60) DEFAULT NULL` | Obligatorio, mínimo 6 caracteres, hash `PASSWORD_BCRYPT` | `$table->string('password', 60)` |
| `telefono` | `varchar(10) DEFAULT NULL` | Capturado en registro (`type="tel"`) | `$table->string('telefono', 10)->nullable()` |
| `admin` | `tinyint(1) DEFAULT NULL` | Por defecto `'0'`; `'1'` identifica administrador | `$table->boolean('admin')->default(false)` |
| `confirmado` | `tinyint(1) DEFAULT NULL` | Por defecto `'0'`; `'1'` tras confirmar vía token | `$table->boolean('confirmado')->default(false)` |
| `token` | `varchar(15) DEFAULT NULL` | Generado con `uniqid()` (13 chars); limpiado a `null` al confirmar o reestablecer password | `$table->string('token', 15)->nullable()` |

### 2.2 Tabla `servicios`
| Columna | Tipo Original | Detalles / Reglas en Código (`models/Servicio.php`) | Equivalente en Migración Laravel 12 |
| :--- | :--- | :--- | :--- |
| `id` | `int NOT NULL AUTO_INCREMENT` | PK | `$table->id()` |
| `nombre` | `varchar(60) DEFAULT NULL` | Obligatorio (`El Nombre del Servicio es Obligatorio`) | `$table->string('nombre', 60)` |
| `precio` | `decimal(5,2) DEFAULT NULL` | Obligatorio y numérico (`El Precio del Servicio es Obligatorio`, `El precio no es válido`) | `$table->decimal('precio', 5, 2)` |

**Datos Semilla (`ServicioSeeder` — 11 registros exactos en `appsalon_mvc.sql`):**
1. `(1, 'Corte de Cabello Mujer ACTUALIZADO', 120.00)`
2. `(2, 'Corte de Cabello Hombre', 80.00)`
3. `(3, 'Corte de Cabello Niño', 60.00)`
4. `(4, 'Peinado Mujer', 80.00)`
5. `(5, 'Peinado Hombre', 60.00)`
6. `(6, 'Peinado Niño', 60.00)`
7. `(7, 'Corte de Barba', 60.00)`
8. `(8, 'Tinte Mujer', 300.00)`
9. `(9, 'Uñas', 400.00)`
10. `(10, 'Lavado de Cabello', 50.00)`
11. `(11, 'Tratamiento Capilar', 150.00)`

### 2.3 Tabla `citas`
| Columna | Tipo Original | Detalles / Reglas en Código (`models/Cita.php`) | Equivalente en Migración Laravel 12 |
| :--- | :--- | :--- | :--- |
| `id` | `int NOT NULL AUTO_INCREMENT` | PK | `$table->id()` |
| `fecha` | `date DEFAULT NULL` | Fecha de la cita (`Y-m-d`) | `$table->date('fecha')->nullable()` |
| `hora` | `time DEFAULT NULL` | Hora de la cita (`HH:MM`) | `$table->time('hora')->nullable()` |
| `usuarioId` | `int DEFAULT NULL` | FK → `usuarios(id)` `ON DELETE SET NULL ON UPDATE SET NULL` | `$table->foreignId('usuarioId')->nullable()->constrained('usuarios')->nullOnDelete()->cascadeOnUpdate()` |

### 2.4 Tabla Pivote `citasServicios`
| Columna | Tipo Original | Detalles / Reglas en Código (`models/CitaServicio.php`) | Equivalente en Migración Laravel 12 |
| :--- | :--- | :--- | :--- |
| `id` | `int NOT NULL AUTO_INCREMENT` | PK | `$table->id()` |
| `citaId` | `int DEFAULT NULL` | FK → `citas(id)` `ON DELETE SET NULL ON UPDATE SET NULL` | `$table->foreignId('citaId')->nullable()->constrained('citas')->nullOnDelete()` |
| `servicioId` | `int DEFAULT NULL` | FK → `servicios(id)` `ON DELETE SET NULL ON UPDATE SET NULL` | `$table->foreignId('servicioId')->nullable()->constrained('servicios')->nullOnDelete()` |

> **Nota sobre modelos Eloquent:** Respetar los nombres de tablas (`usuarios`, `servicios`, `citas`, `citasServicios`) y llaves foráneas (`usuarioId`, `citaId`, `servicioId`) o mapearlos explícitamente en los modelos Eloquent (`protected $table`, `belongsTo`, `belongsToMany`) para mantener compatibilidad total con la base de datos `appsalon_mvc`. El modelo de solo lectura `models/AdminCita.php` que ejecutaba un `LEFT OUTER JOIN` plano sobre `citas`, `usuarios`, `citasServicios` y `servicios` se reemplaza limpiamente en Laravel con `Cita::with(['usuario', 'servicios'])->where('fecha', $fecha)->get()`.

---

## 3. Mapa de Rutas, Controladores y Reglas de Negocio

Todas las rutas definidas originalmente en `public/index.php` y su correspondencia exacta en Laravel 12 + Inertia:

### 3.1 Módulo de Autenticación y Cuentas (`controllers/LoginController.php` + `classes/Email.php`)

| Ruta Original | Método | Acción Original | Comportamiento y Reglas Exactas a Preservar | Vista Origen → Componente React (Inertia) |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | `LoginController::login` | Muestra formulario de login (`email`, `password`) y enlaces a `/crear-cuenta` y `/olvide`. | `views/auth/login.php` → `Pages/Auth/Login.jsx` |
| `/` | `POST` | `LoginController::login` | Valida `email` y `password` obligatorios. Busca usuario por `email`. Si no existe: alerta error `"Usuario no encontrado"`. Verifica `password_verify` y `confirmado == 1`; si falla: alerta error `"Password Incorrecto o tu cuenta no ha sido confirmada"`. Si es exitoso: inicia sesión guardando `id`, `nombre` (`nombre . " " . apellido`), `email`, `login = true`. Si `admin === "1"`, guarda `admin` en sesión y redirige a `/admin`; si no, redirige a `/cita`. | Redirección Inertia a `/admin` o `/cita` |
| `/logout` | `GET` *(o POST en Inertia)* | `LoginController::logout` | Limpia la sesión y redirige a `/`. | Enlace `.boton-cerrar-sesion` en `Barra` |
| `/crear-cuenta` | `GET` | `LoginController::crear` | Muestra formulario con `nombre`, `apellido`, `telefono`, `email`, `password` y enlaces a `/` y `/olvide`. | `views/auth/crear-cuenta.php` → `Pages/Auth/CrearCuenta.jsx` |
| `/crear-cuenta` | `POST` | `LoginController::crear` | Valida: `"El Nombre es Obligatorio"`, `"El Apellido es Obligatorio"`, `"El Email es Obligatorio"`, `"El Password es Obligatorio"`, `"El password debe contener al menos 6 caracteres"`. Verifica unicidad de email (`"El Usuario ya esta registrado"`). Hashea password (`bcrypt`), genera `token = uniqid()`, envía correo `"Confirma tu cuenta"` con enlace a `/confirmar-cuenta?token={token}` desde `cuentas@appsalon.com` (`AppSalon`), guarda usuario y redirige a `/mensaje`. | Redirección a `/mensaje` |
| `/mensaje` | `GET` | `LoginController::mensaje` | Muestra título `"Confirma tu cuenta"` y texto `"Hemos enviado las instrucciones para confirmar tu cuenta a tu e-mail."`. | `views/auth/mensaje.php` → `Pages/Auth/Mensaje.jsx` |
| `/confirmar-cuenta` | `GET` | `LoginController::confirmar` | Lee query `?token=`. Busca usuario por `token`. Si no existe: alerta error `"Token No Válido"`. Si existe: asigna `confirmado = 1`, `token = null`, guarda y muestra alerta éxito `"Cuenta Comprobada Correctamente"`. Muestra enlace a `/`. | `views/auth/confirmar-cuenta.php` → `Pages/Auth/ConfirmarCuenta.jsx` |
| `/olvide` | `GET` | `LoginController::olvide` | Muestra formulario con campo `email` y enlaces a `/` y `/crear-cuenta`. | `views/auth/olvide-password.php` → `Pages/Auth/OlvidePassword.jsx` |
| `/olvide` | `POST` | `LoginController::olvide` | Valida `"El email es Obligatorio"`. Busca usuario por `email` y verifica `confirmado === "1"`. Si cumple: genera `token = uniqid()`, guarda, envía correo `"Reestablece tu contraseña"` con enlace a `/reestablecer?token={token}` y muestra alerta éxito `"Revisa tu email"`. Si no: alerta error `"El Usuario no existe o no esta confirmado"`. | Misma vista con alertas |
| `/reestablecer` | `GET` | `LoginController::recuperar` | Lee query `?token=`. Si falta o no coincide con ningún usuario: alerta error `"Token no recibido o está vacío"` / `"Token No Válido"` y flag `$error = true` (oculta el formulario `<form>`). Si es válido, muestra formulario de nuevo `password`. | `views/auth/reestablecer.php` → `Pages/Auth/Reestablecer.jsx` |
| `/reestablecer` | `POST` | `LoginController::recuperar` | Valida `"El Password es obligatorio"` y `"El Password debe tener al menos 6 caracteres"`. Hashea el nuevo password, limpia `token = null`, guarda y redirige a `/`. | Redirección a `/` |

### 3.2 Módulo de Citas del Cliente (`controllers/CitaController.php` + `src/js/app.js` + `controllers/APIController.php`)

Protegido por autenticación (`isAuth()`: si no hay sesión activa, redirige a `/`).

| Ruta Original | Método | Acción Original | Comportamiento y Reglas Exactas a Preservar | Vista Origen → Componente React (Inertia) |
| :--- | :--- | :--- | :--- | :--- |
| `/cita` | `GET` | `CitaController::index` | Renderiza el panel de creación de cita con `nombre` e `id` del usuario autenticado, barra superior (`Hola: {nombre}` + botón `Cerrar Sesión`), navegación por 3 pasos (`.tabs`) y paginador (`&laquo; Anterior`, `Siguiente &raquo;`). | `views/cita/index.php` → `Pages/Cita/Index.jsx` |
| `/api/servicios` | `GET` | `APIController::index` | Devuelve JSON con todos los registros de `servicios` (`id`, `nombre`, `precio`). *(En Inertia puede pasarse como prop directa a `Pages/Cita/Index.jsx` o mantenerse también como endpoint `/api/servicios`)*. | Consumido en Paso 1 |
| `/api/citas` | `POST` | `APIController::guardar` | Recibe `fecha`, `hora`, `usuarioId` y `servicios` (lista de IDs). Inserta en `citas` y por cada servicio inserta en `citasServicios` (`citaId`, `servicioId`). Devuelve `{ resultado: ... }`. | Consumido al pulsar `Reservar Cita` en Paso 3 |

#### Reglas Interactivas del Asistente de Citas (`src/js/app.js` → Estado en React):
1. **Navegación de Pasos (`pasoInicial = 1`, `pasoFinal = 3`):**
   - **Paso 1 (`#paso-1` - Servicios):** Muestra grid `.listado-servicios`. Al hacer clic en un `.servicio`, alterna selección (agrega/quita del arreglo `cita.servicios` y alterna la clase `.seleccionado`). Botón `Anterior` tiene clase `.ocultar` (`visibility: hidden`); botón `Siguiente` visible.
   - **Paso 2 (`#paso-2` - Información Cita):** Formulario con:
     - `Nombre`: `<input id="nombre" type="text" value={nombre} disabled />`.
     - `Fecha`: `<input id="fecha" type="date" min={hoy} />`. **Regla de negocio:** No se trabaja en domingo (`new Date(valor).getUTCDay() === 0`). Si elige domingo, limpia el valor y muestra alerta de error: `"Domingos No Trabajamos, Elije otro día de Lunes a Sábado"` (desaparece a los 3 segundos).
     - `Hora`: `<input id="hora" type="time" />`. **Regla de negocio:** Toma la hora (`horaCita.split(":")[0]`). Si `hora < 10 || hora > 19`, limpia el valor y muestra alerta de error: `"Hora No Válida"` (desaparece a los 3 segundos).
     - Botones `Anterior` y `Siguiente` visibles.
   - **Paso 3 (`#paso-3` - Resumen `.contenido-resumen`):** Botón `Siguiente` tiene clase `.ocultar`; botón `Anterior` visible.
     - Si falta `fecha`, `hora` o `cita.servicios.length === 0`, muestra alerta de error permanente (`desaparece = false`): `"Faltan datos de Servicios, Fecha u Hora"`.
     - Si está completo, muestra:
       - `<h3>Resumen de Servicios</h3>` + lista de `.contenedor-servicio` con nombre y `<p><span>Precio:</span> ${precio}</p>`.
       - `<h3>Resumen de Cita</h3>` + `<p><span>Nombre:</span> {nombre}</p>`, `<p><span>Fecha:</span> {fechaFormateada}</p>` (formateada con `toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })`), `<p><span>Hora:</span> {hora} Horas</p>`.
       - Botón `<button class="boton">Reservar Cita</button>`.
2. **Reserva y Alerta SweetAlert2 (`reservarCita`):**
   - Al guardar con éxito, dispara:
     ```js
     Swal.fire({
         icon: 'success',
         title: 'Cita Creada',
         text: 'Tu cita fue creada correctamente',
         button: 'OK'
     })
     ```
     y reinicia el estado / recarga la vista.
   - En caso de fallo, dispara:
     ```js
     Swal.fire({
         icon: 'error',
         title: 'Error',
         text: 'Hubo un error al guardar la cita'
     })
     ```

### 3.3 Módulo de Administración de Citas (`controllers/AdminController.php` + `src/js/buscador.js`)

Protegido por rol administrador (`isAdmin()`: verifica `admin == 1`, de lo contrario redirige a `/`).

| Ruta Original | Método | Acción Original | Comportamiento y Reglas Exactas a Preservar | Vista Origen → Componente React (Inertia) |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `GET` | `AdminController::index` | Recibe `?fecha=YYYY-MM-DD` (por defecto `date('Y-m-d')`). Valida la fecha con `checkdate`; si es inválida redirige a `/404`. Consulta las citas de esa fecha con cliente (`nombre + apellido`), `email`, `telefono` y sus `servicios` (`nombre`, `precio`). | `views/admin/index.php` → `Pages/Admin/Index.jsx` |
| `/api/eliminar` | `POST` | `APIController::eliminar` | Recibe `id` de la cita, elimina el registro en `citas` y redirige de vuelta (`back()`). | Botón `.boton-eliminar` (`Eliminar`) en cada cita |

#### Comportamiento en Vista de Administración (`views/admin/index.php` + `buscador.js`):
- Incluye `Barra` superior con enlaces de administrador (`.barra-servicios`): `Ver Citas` (`/admin`), `Ver Servicios` (`/servicios`), `Nuevo Servicio` (`/servicios/crear`).
- Selector `<input type="date" id="fecha" name="fecha" value={fecha} />`: al cambiar la fecha (`onChange`), navega a `/admin?fecha={fechaSeleccionada}` (con `router.get('/admin', { fecha })` de Inertia).
- Si no hay citas en la fecha seleccionada: muestra `<h2>No Hay Citas en esta fecha</h2>`.
- Listado `<ul class="citas">` dentro de `#citas-admin`: por cada cita muestra `ID`, `Hora`, `Cliente`, `Email`, `Teléfono`, encabezado `<h3>Servicios</h3>`, cada servicio con `<p class="servicio">{nombre} {precio}</p>`, suma acumulada `<p class="total">Total: <span>$ {total}</span></p>` y formulario POST a `/api/eliminar` con botón `.boton-eliminar` (`Eliminar`).

### 3.4 Módulo CRUD de Servicios (`controllers/ServicioController.php`)

Protegido íntegramente por rol administrador (`isAdmin()`).

| Ruta Original | Método | Acción Original | Comportamiento y Reglas Exactas a Preservar | Vista Origen → Componente React (Inertia) |
| :--- | :--- | :--- | :--- | :--- |
| `/servicios` | `GET` | `ServicioController::index` | Lista todos los servicios en `<ul class="servicios">`, mostrando `Nombre: <span>{nombre}</span>`, `Precio: <span>${precio}</span>`, botón `Actualizar` (`/servicios/actualizar?id={id}`) y formulario POST a `/servicios/eliminar` con botón `.boton-eliminar` (`Borrar`). | `views/servicios/index.php` → `Pages/Servicios/Index.jsx` |
| `/servicios/crear` | `GET` | `ServicioController::crear` | Muestra `Barra`, `Alertas` y formulario (`views/servicios/formulario.php`) con campos `nombre` (`type="text"`) y `precio` (`type="number"`), botón `Guardar Servicio`. | `views/servicios/crear.php` → `Pages/Servicios/Crear.jsx` |
| `/servicios/crear` | `POST` | `ServicioController::crear` | Valida `"El Nombre del Servicio es Obligatorio"`, `"El Precio del Servicio es Obligatorio"`, `"El precio no es válido"`. Guarda el servicio y redirige a `/servicios`. | Redirección a `/servicios` |
| `/servicios/actualizar` | `GET` | `ServicioController::actualizar` | Recibe `?id={id}` (valida `is_numeric`), carga el servicio y muestra el formulario prellenado con botón `Actualizar`. | `views/servicios/actualizar.php` → `Pages/Servicios/Actualizar.jsx` |
| `/servicios/actualizar` | `POST` | `ServicioController::actualizar` | Valida `nombre` y `precio` con las mismas reglas, actualiza el registro y redirige a `/servicios`. | Redirección a `/servicios` |
| `/servicios/eliminar` | `POST` | `ServicioController::eliminar` | Recibe `id` por POST, busca el servicio, lo elimina y redirige a `/servicios`. | Acción desde `Pages/Servicios/Index.jsx` |

---

## 4. Arquitectura Visual y Estilos SASS (Preservación 1:1)

La interfaz gráfica original **no utiliza Tailwind ni Bootstrap**; está construida con SASS modular (`src/scss/`), CSS Grid y Flexbox. Para mantener la interfaz gráfica idéntica:

1. **Layout Principal (`views/layout.php` → `Layouts/MainLayout.jsx` + `resources/views/app.blade.php`):**
   - Fuente en `<head>`: `https://fonts.googleapis.com/css2?family=Poppins:wght@300;700;900&display=swap`.
   - Favicon: `/build/img/icono.png` (o ruta equivalente en `public/img/icono.png`).
   - Título: `App Salón - Barbería`.
   - Estructura DOM obligatoria:
     ```html
     <div class="contenedor-app">
         <div class="imagen"></div>
         <div class="app">
             <!-- Contenido de la página Inertia -->
         </div>
     </div>
     ```
2. **Estructura SASS (`src/scss` → `resources/scss` compilado por Vite):**
   - `app.scss` importa `@use 'base'`, `@use 'layout'`, `@use 'componentes'`.
   - `base/`: `_normalize.scss`, `_variables.scss` (`$azul: #0da6f3`, `$rojo: #cb0000`, `$verde: #329f00`, `$negro: #1a1b15`, `$blanco: #FFFFFF`, `$gris: #e1e1e1`, `$separacion: 5rem`), `_mixins.scss` (`telefono`, `tablet`, `desktop`, `boton`, `grid`), `_globales.scss`, `_tipografia.scss`.
   - `layout/`: `_UI.scss` (`.contenedor-app` grid 2 columnas en tablet, `.imagen` con `1.jpg`, `.app` con scroll, `.barra`, `.barra-servicios`), `_cita.scss` (`.seccion`, `.mostrar`, `.ocultar`), `_servicios.scss` (`.listado-servicios`, `.servicio`, `.seleccionado`, `.precio-servicio`), `_resumen.scss` (`.contenido-resumen`, `.contenedor-servicio`), `_admin.scss` (`.citas`, `.servicios`).
   - `componentes/`: `_formulario.scss` (`.formulario`, `.campo`), `_botones.scss` (`.boton`, `.boton-cerrar-sesion`, `.boton-eliminar`), `_acciones.scss` (`.acciones`), `_alertas.scss` (`.alerta.error`, `.alerta.exito`), `_tabs.scss` (`.tabs`, `button.actual`), `_paginacion.scss` (`.paginacion`, `.ocultar`).
3. **Imágenes (`src/img/1.jpg`, `public/build/img/1.jpg`, `1.webp`, `icono.png`):**
   - Conservar en `public/img/` (o `resources/img/`) asegurando que la regla `background-image: url(../img/1.jpg)` en `_UI.scss` resuelva correctamente en Vite.
4. **Componentes Compartidos de React (`resources/js/Components/`):**
   - `Alertas.jsx`: replica `views/templates/alertas.php` renderizando `<div className={`alerta ${tipo}`}>{mensaje}</div>` tanto para errores de validación como para mensajes flash de éxito/error.
   - `Barra.jsx`: replica `views/templates/barra.php` renderizando `.barra` (`Hola: {usuario.nombre}` + enlace/botón `.boton-cerrar-sesion`) y, cuando `usuario.admin` es verdadero, `.barra-servicios` con los 3 enlaces (`Ver Citas`, `Ver Servicios`, `Nuevo Servicio`).
   - `ServicioFormulario.jsx`: replica `views/servicios/formulario.php` con los campos `.campo` para `nombre` y `precio`.

---

## 5. Metodología Spec Kit (`specs/`) y Plan de Migración

Toda la ejecución del proyecto se rige por las especificaciones en la carpeta `specs/`:

| Especificación | Carpeta en `specs/` | Contenido (`spec.md`, `plan.md`, `tasks.md`) |
| :--- | :--- | :--- |
| **Constitución** | `specs/constitution.md` | Principios innegociables (Opción A in-situ, Wayfinder, Fidelidad SASS 1:1, Cero invención). |
| **Spec 001** | `specs/001-foundation-laravel-inertia/` | Respaldo `_legacy/`, instalación de Laravel 12 + Inertia + React + Wayfinder, Vite + SASS (`resources/scss/app.scss`) y `MainLayout.jsx`. |
| **Spec 002** | `specs/002-database-models-seeders/` | Migraciones de `usuarios`, `servicios`, `citas`, `citasServicios`, modelos Eloquent y `ServicioSeeder` (11 servicios). |
| **Spec 003** | `specs/003-auth-and-accounts/` | `AuthController`, `ConfirmarCuentaMail`, `ReestablecerPasswordMail`, middlewares (`auth` / `admin`) y las 6 páginas de `Pages/Auth/*`. |
| **Spec 004** | `specs/004-client-appointments-wizard/` | `CitaController`, `APIController` y asistente interactivo de 3 pasos en `Pages/Cita/Index.jsx` con validaciones L-S, 10-19h y SweetAlert2. |
| **Spec 005** | `specs/005-admin-and-services-crud/` | `AdminController`, `ServicioController`, buscador de citas por fecha (`Pages/Admin/Index.jsx`) y CRUD de servicios (`Pages/Servicios/*`). |
| **Spec 006** | `specs/006-payments-cards-and-pos/` | **Plus de Pagos Multi-Banco:** Tabla `pagos`, arquitectura Driver Pattern (`PaymentGatewayInterface`, `SandboxBankGateway`, `GenericRestBankGateway`) para conectar cualquier API bancaria, pago con tarjeta directo en Paso 3 (Resumen) y cobro con Terminal Punto de Venta (TPV / POS) en `/cita` y `/admin`. |
| **Spec 007** | `specs/007-rustic-modern-app-shell-ui/` | **UI Barbería Moderna-Rústica + Mobile-First App Shell:** Paleta carbón/cuero/latón (`Playfair Display` + `Poppins`), `BottomTabBar` fija en móvil (`<768px`) con Wayfinder, zonas seguras `.pb-safe`, ergonomía táctil, cards de Admin/Servicios y toggle de tamaño de texto. |
| **Spec 008** | `specs/008-rich-services-catalog/` | **Catálogo Enriquecido de Servicios:** Migración aditiva (`descripcion`, `imagen`, `duracion_minutos`, `activo`), subida/preview de foto del corte/barba, toggle Activo/Oculto y confirmación SweetAlert2 al eliminar. |
| **Spec 009** | `specs/009-roles-barbers-and-clients/` | **Roles Multi-Barbero y Cartera de Clientes:** Columna `rol` (`admin`, `barbero`, `cliente`), gestión de Barberos con foto/especialidad/estado, cartera de Clientes filtrable por barbero y alta de prospectos. |
| **Spec 010** | `specs/010-face-shape-guide-and-barber-catalog/` | **Guía Visual de Visagismo + Catálogo Fotográfico:** Siluetas SVG interactivas por tipo de rostro (`redondo`, `ovalado`, `cuadrado`, `alargado`, `diamante`), recomendaciones de corte, 8 fotografías editoriales y `CatalogoBarberiaSeeder`. |
| **Spec 011** | `specs/011-family-booking-and-sidebar-reservations/` | **Reservas Familiares + Resumen en Sidebar:** Permite reservar para el titular, hijos o familiares (`para_quien`, `nombre_beneficiario`) y muestra en vivo las próximas reservaciones del cliente en el Sidebar. |

### Regla de Enrutamiento con Laravel Wayfinder
En `vite.config.js` se configura obligatoriamente:
```js
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
```
Todos los componentes de React (`Pages/*` y `Components/*`) deben consumir las rutas y acciones de controladores exportadas por Wayfinder en `resources/js/actions/` y `resources/js/routes/` en lugar de cadenas URL escritas a mano.

---

## 6. Reglas de Trabajo y Límites para el Agente

1. **Spec-First:** Antes de implementar o modificar cualquier fase, leer su `spec.md`, `plan.md` y `tasks.md` dentro de `specs/`. Si se acuerda un cambio de criterio con el usuario, actualizar primero la spec correspondiente.
2. **Alcance Controlado por Specs:** Conservar todas las funcionalidades originales (Specs `001` a `005`) e integrar el módulo autorizado de **Pagos con Tarjeta en Línea y Terminal POS Multi-Banco (`Spec 006`)** sin introducir frameworks CSS externos (MUI, Bootstrap, Tailwind).
3. **Fidelidad Visual:** Conservar las clases CSS originales (`.contenedor-app`, `.imagen`, `.app`, `.nombre-pagina`, `.descripcion-pagina`, `.barra`, `.barra-servicios`, `.tabs`, `.seccion`, `.listado-servicios`, `.servicio`, `.seleccionado`, `.formulario`, `.campo`, `.boton`, `.boton-eliminar`, `.boton-cerrar-sesion`, `.alerta.error`, `.alerta.exito`, `.citas`, `.servicios`, `.paginacion`, `.acciones`).
4. **Mensajes y Validaciones:** Mantener los textos en español y las reglas de validación del proyecto original (mínimo 6 caracteres en password, bloqueo de domingos, horario de 10 a 19 hrs, verificación de cuenta confirmada).
5. **Control de Ejecución:** No ejecutar migraciones destructivas, seeders ni eliminar el respaldo `_legacy/` sin autorización explícita del usuario en la fase correspondiente.
