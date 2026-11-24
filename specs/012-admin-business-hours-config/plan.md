# Plan Técnico 012: Configuración de Horarios Laborales

- `database/migrations/2026_01_01_000011_create_horarios_laborales_table.php`
- `app/Models/HorarioLaboral.php`
- `app/Http/Controllers/HorarioController.php` (`index`, `actualizar`)
- `app/Http/Controllers/CitaController.php` (enviar `diasCerrados`)
- `app/Http/Controllers/APIController.php` (`disponibilidad` y `guardar` dinámicos según `horarios_laborales`)
- `routes/web.php` (`GET /horarios`, `POST /horarios`)
- `resources/js/Pages/Horarios/Index.jsx`
- `resources/js/Components/AppSidebar.jsx` (enlace `Horarios`), `Components/BarberDatePicker.jsx` (`disabledDaysOfWeek`), `Pages/Cita/Index.jsx`
