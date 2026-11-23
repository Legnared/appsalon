# Plan Técnico 008: Catálogo Enriquecido de Servicios

## Archivos a Crear / Modificar
- `database/migrations/2026_01_01_000005_add_detalles_to_servicios_table.php`
- `app/Models/Servicio.php` (`$fillable`, `$casts`, accessor `imagen_url` en `$appends`)
- `app/Http/Controllers/ServicioController.php` (`crear`, `actualizar` con `multipart/form-data`, `toggleActivo`, `eliminar` limpiando imagen)
- `app/Http/Controllers/CitaController.php` y `APIController.php` (filtrar `where('activo', true)`)
- `routes/web.php` (ruta `POST /servicios/toggle-activo`)
- `resources/js/Components/ServicioFormulario.jsx` (descripción, duración, switch activo, selector de foto con preview y opción quitar foto)
- `resources/js/Pages/Servicios/Index.jsx`, `Crear.jsx`, `Actualizar.jsx` (confirmación SweetAlert2 al borrar, toggle rápido y envío `forceFormData: true`)
- `resources/js/Pages/Cita/Index.jsx` (tarjetas de servicio con foto, descripción y duración)
- `resources/scss/layout/_admin.scss`, `_servicios.scss` y `componentes/_formulario.scss`
