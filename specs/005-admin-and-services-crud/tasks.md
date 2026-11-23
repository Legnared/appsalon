# Tareas 005: Panel de Administración y CRUD de Servicios

- [x] **T005.1:** Implementar `AdminController@index` con validación `checkdate` y carga de citas con cliente y servicios por fecha.
- [x] **T005.2:** Implementar `ServicioController` (`index`, `showCrear`, `crear`, `showActualizar`, `actualizar`, `eliminar`) con las validaciones exactas de `nombre` y `precio`.
- [x] **T005.3:** Registrar las rutas `/admin` y `/servicios/*` bajo el middleware `admin` en `routes/web.php` y regenerar Wayfinder.
- [x] **T005.4:** Construir `resources/js/Pages/Admin/Index.jsx` con selector de fecha reactivo, desglose de servicios, cálculo de total y eliminación de citas vía Wayfinder.
- [x] **T005.5:** Construir `resources/js/Pages/Servicios/Index.jsx`, `Crear.jsx` y `Actualizar.jsx` reutilizando `Components/ServicioFormulario.jsx`, `Components/Barra.jsx` y `Components/Alertas.jsx`.
