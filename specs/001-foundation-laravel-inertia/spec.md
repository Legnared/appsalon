# Spec 001: Fundación Laravel 12 + Inertia.js + React + Wayfinder + SASS Original

## 1. Objetivo
Transformar el directorio raíz `c:\Apache24\htdocs\appsalon` desde el proyecto PHP 8 MVC legacy hacia una aplicación **Laravel 12** moderna con **Inertia.js (React)**, **Laravel Wayfinder** y compilación nativa de los estilos **SASS** originales mediante **Vite**, preservando en `_legacy/` el código anterior como respaldo.

## 2. Alcance y Requisitos

### R1. Respaldo In-Situ (`_legacy/`)
- Mover los directorios y archivos exclusivos del MVC propietario (`Router.php`, `controllers/`, `models/`, `views/`, `includes/`, `classes/`, `gulpfile.js`, `Procfile`, `public/index.php`, `public/build/`) a `_legacy/`.
- Conservar accesibles `appsalon_mvc.sql`, `src/scss/` y `src/img/` para reciclarlos en la nueva estructura de Laravel 12.

### R2. Instalación y Configuración de Laravel 12 + Inertia + Wayfinder
- Inicializar la estructura de **Laravel 12** en la raíz del proyecto.
- Instalar dependencias Backend (`composer.json`):
  - `laravel/framework: ^12.0`
  - `inertiajs/inertia-laravel: ^2.0`
  - `laravel/wayfinder: ^0.1`
- Instalar dependencias Frontend (`package.json`):
  - `react`, `react-dom`
  - `@inertiajs/react`
  - `@laravel/vite-plugin-wayfinder`
  - `@vitejs/plugin-react`
  - `laravel-vite-plugin`, `vite`
  - `sass` (Dart Sass para compilar `resources/scss/app.scss`)
  - `sweetalert2`

### R3. Configuración de Vite con Wayfinder (`vite.config.js`)
- Integrar `laravel-vite-plugin`, `@vitejs/plugin-react` y `wayfinder` (`import { wayfinder } from '@laravel/vite-plugin-wayfinder'`).
- Entradas de Vite: `['resources/scss/app.scss', 'resources/js/app.jsx']`.
- Configurar generación automática de acciones y rutas tipadas de Wayfinder en `resources/js/actions` y `resources/js/routes`.

### R4. Reciclaje 1:1 de Estilos SASS (`src/scss` → `resources/scss`) e Imágenes
- Copiar `src/scss/` a `resources/scss/` manteniendo `base/`, `layout/` y `componentes/`.
- Copiar `src/img/1.jpg` y `public/build/img/icono.png` (y `1.webp`) a `public/img/`.
- Ajustar en `resources/scss/layout/_UI.scss` la referencia `background-image: url(/img/1.jpg);` para que resuelva limpiamente desde `public/img/1.jpg`.

### R5. Layout Principal y Componentes Base Compartidos
- **`resources/views/app.blade.php`:**
  - Incluir Google Fonts `Poppins:wght@300;700;900`, favicon `/img/icono.png`, título `App Salón - Barbería`, `@viteReactRefresh`, `@vite(['resources/scss/app.scss', 'resources/js/app.jsx'])` e `@inertia`.
- **`resources/js/Layouts/MainLayout.jsx`:**
  - Renderizar exactamente:
    ```jsx
    <div className="contenedor-app">
        <div className="imagen"></div>
        <div className="app">
            {children}
        </div>
    </div>
    ```
- **`resources/js/Components/Alertas.jsx`:**
  - Renderizar alertas agrupadas por tipo (`error`, `exito`) con `<div className={`alerta ${tipo}`}>{mensaje}</div>`, soportando tanto `errors` de validación de Inertia como mensajes flash compartidos (`flash.error`, `flash.exito`) y alertas locales.
- **`resources/js/Components/Barra.jsx`:**
  - Mostrar `.barra` con `<p>Hola: {auth.user?.nombreCompleto}</p>` y botón/enlace `.boton-cerrar-sesion` (`Cerrar Sesión`) conectado vía Wayfinder.
  - Si `auth.user?.admin` es verdadero, renderizar `.barra-servicios` con los 3 enlaces (`Ver Citas`, `Ver Servicios`, `Nuevo Servicio`) usando las rutas generadas por Wayfinder.

## 3. Criterios de Aceptación
- `npm run build` compila sin errores `resources/scss/app.scss` y `resources/js/app.jsx` y ejecuta Wayfinder generando las rutas/acciones.
- El layout `.contenedor-app` muestra la imagen lateral de barbería a la izquierda y el contenedor `.app` con fondo oscuro `#1a1b15` y tipografía `Poppins` a la derecha.
