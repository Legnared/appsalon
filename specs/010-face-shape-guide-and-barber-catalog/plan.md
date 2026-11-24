# Plan Técnico 010: Guía Visual de Visagismo y Catálogo Fotográfico

- `database/migrations/2026_01_01_000008_add_visagismo_to_servicios_table.php`
- `app/Models/Servicio.php` (`tipos_rostro` cast a `array`, `recomendacion_rostro`)
- `app/Http/Controllers/ServicioController.php` (validar y guardar `tipos_rostro` y `recomendacion_rostro`)
- `database/seeders/CatalogoBarberiaSeeder.php` (8 cortes actuales con fotos en `storage/app/public/servicios/`)
- `resources/js/Components/GuiaTipoRostro.jsx` (siluetas SVG de rostros + consejo de proporciones + filtro en vivo)
- Integración en `resources/js/Pages/Cita/Index.jsx`, `Components/ServicioFormulario.jsx`, `Pages/Servicios/Crear.jsx`, `Actualizar.jsx` y `resources/scss/layout/_servicios.scss`.
