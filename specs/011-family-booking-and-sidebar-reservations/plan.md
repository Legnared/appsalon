# Plan Técnico 011: Reservas Familiares y Resumen en Sidebar

- `database/migrations/2026_01_01_000009_add_beneficiario_to_citas_table.php`
- `app/Models/Cita.php` (`$fillable` con `para_quien`, `nombre_beneficiario`)
- `app/Http/Controllers/APIController.php` (validar y guardar `para_quien` y `nombre_beneficiario`)
- `app/Http/Controllers/AdminController.php` (incluir `para_quien` y `nombre_beneficiario` en las cards de citas)
- `app/Http/Middleware/HandleInertiaRequests.php` (compartir `misReservaciones` para clientes autenticados)
- `resources/js/Components/AppSidebar.jsx` (sección "Mis Próximas Citas" en el costado izquierdo)
- `resources/js/Pages/Cita/Index.jsx` (selector Para mí / Hijo / Familiar + resumen móvil de próximas citas + reload reactivo)
- `resources/js/Pages/Admin/Index.jsx` (badge/texto del beneficiario en cada cita)
- `resources/scss/componentes/_bottom-nav.scss` y `resources/scss/layout/_cita.scss`
