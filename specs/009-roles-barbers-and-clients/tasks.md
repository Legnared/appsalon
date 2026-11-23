# Tareas 009: Roles, Barberos y Clientes

### Fase 1: Roles y Gestión de Barberos
- [x] **T009.1:** Crear migración aditiva `add_roles_and_barbers_support` (`rol`, `especialidad`, `foto`, `activo`, `barbero_id` en `usuarios` y `barberoId` en `citas`).
- [x] **T009.2:** Actualizar modelos `Usuario` y `Cita`, `HandleInertiaRequests` y `AdminUsuarioSeeder`.
- [x] **T009.3:** Implementar `BarberoController` (`index`, `showCrear`, `crear`, `showActualizar`, `actualizar`, `toggleActivo`) y rutas en `routes/web.php`.
- [x] **T009.4:** Crear `Components/BarberoFormulario.jsx`, `Pages/Barberos/Index.jsx`, `Crear.jsx` y `Actualizar.jsx` con foto, especialidad y estado activo.
- [x] **T009.5:** Agregar navegación a **Barberos** en `Barra.jsx` y `BottomTabBar.jsx` con Wayfinder, compilar con Vite y validar PHP.

### Fase 2: Cartera de Clientes y Prospectos (Próxima iteración)
- [ ] **T009.6:** Implementar `ClienteController` y vistas `Pages/Clientes/*` (filtro por barbero, buscador, alta de clientes/prospectos e historial).

### Fase 3: Portal del Barbero y Selección de Barbero en Cita (Próxima iteración)
- [ ] **T009.7:** Habilitar acceso del rol `barbero` a su propia agenda y clientes, y selector de barbero en `/cita`.
