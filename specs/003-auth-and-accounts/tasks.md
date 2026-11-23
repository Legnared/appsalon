# Tareas 003: Autenticación, Registro, Confirmación y Recuperación

- [ ] **T003.1:** Crear `ConfirmarCuentaMail` y `ReestablecerPasswordMail` con el HTML exacto de `_legacy/classes/Email.php`.
- [ ] **T003.2:** Crear middleware `EnsureUserIsAdmin` (`isAdmin`) y configurar redirección de `auth` (`isAuth`) hacia `/`.
- [ ] **T003.3:** Implementar `AuthController` con las acciones `showLogin`, `login`, `logout`, `showCrear`, `crear`, `mensaje`, `confirmar`, `showOlvide`, `olvide`, `showRecuperar` y `recuperar`.
- [ ] **T003.4:** Registrar rutas de autenticación en `routes/web.php` y regenerar rutas Wayfinder.
- [ ] **T003.5:** Crear vistas React `Login.jsx`, `CrearCuenta.jsx`, `Mensaje.jsx`, `ConfirmarCuenta.jsx`, `OlvidePassword.jsx` y `Reestablecer.jsx` conectadas con Wayfinder y `Components/Alertas.jsx`.
