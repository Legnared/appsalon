# Tareas 001: Fundación Laravel 12 + Inertia + React + Wayfinder

- [x] **T001.1:** Crear directorio `_legacy/` y respaldar los archivos del MVC propietario (`Router.php`, `controllers/`, `models/`, `views/`, `includes/`, `classes/`, `gulpfile.js`, `Procfile`, `public/index.php`, `public/build/`).
- [x] **T001.2:** Inicializar estructura base de Laravel 12 en `c:\Apache24\htdocs\appsalon` y conservar `.env` listo para configuración MySQL en Spec 002.
- [x] **T001.3:** Instalar paquetes Composer (`inertiajs/inertia-laravel`, `laravel/wayfinder`) y registrar el middleware `HandleInertiaRequests` en `bootstrap/app.php`.
- [x] **T001.4:** Configurar `package.json` e instalar `@inertiajs/react`, `react`, `react-dom`, `@vitejs/plugin-react`, `laravel-vite-plugin`, `@laravel/vite-plugin-wayfinder`, `sass` y `sweetalert2`.
- [x] **T001.5:** Configurar `vite.config.js` con `wayfinder({ formVariants: true })`, `react()`, `laravel()`, `loadPaths` para SASS y `postcss` aislado.
- [x] **T001.6:** Migrar `src/scss/` a `resources/scss/` y las imágenes a `public/img/` (`1.jpg`, `1.webp`, `icono.png`), actualizando la ruta de imagen en `resources/scss/layout/_UI.scss`.
- [x] **T001.7:** Crear `resources/views/app.blade.php` y `resources/js/app.jsx` con resolución de páginas y `MainLayout.jsx` por defecto.
- [x] **T001.8:** Crear `Layouts/MainLayout.jsx`, `Components/Alertas.jsx`, `Components/Barra.jsx` y `Components/ServicioFormulario.jsx`.
- [x] **T001.9:** Ejecutar `php artisan wayfinder:generate` y `npm run build` para verificar la compilación limpia de SASS, React y Wayfinder.
