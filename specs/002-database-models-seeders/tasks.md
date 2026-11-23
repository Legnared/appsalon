# Tareas 002: Base de Datos, Migraciones, Modelos y Seeders

- [ ] **T002.1:** Crear migración `create_usuarios_table` respetando columnas y tipos de `usuarios`.
- [ ] **T002.2:** Crear migración `create_servicios_table` respetando columnas `nombre` (`varchar(60)`) y `precio` (`decimal(5,2)`).
- [ ] **T002.3:** Crear migración `create_citas_table` con `fecha`, `hora` y FK `usuarioId` (`nullOnDelete`).
- [ ] **T002.4:** Crear migración `create_citas_servicios_table` (`citasServicios`) con FKs `citaId` y `servicioId` (`nullOnDelete`).
- [ ] **T002.5:** Implementar los modelos Eloquent `Usuario`, `Servicio`, `Cita` y `CitaServicio` y configurar `config/auth.php` para usar `App\Models\Usuario`.
- [ ] **T002.6:** Crear `ServicioSeeder` con los 11 servicios de `appsalon_mvc.sql` y registrarlo en `DatabaseSeeder`.
