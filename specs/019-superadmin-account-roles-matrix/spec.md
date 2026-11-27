# Spec 019: Cuenta Super-Admin, Matriz de Roles/Permisos y Menú Agrupado en Sidebar

## 1. Objetivo
Permitir al Super-Admin técnico modificar su propio nombre, correo y contraseña desde la interfaz, consultar una matriz clara de roles y permisos del SaaS, y organizar las herramientas técnicas (`Super-Admin SaaS`, `Mi Cuenta y Roles`, `Bitácora`) dentro de un grupo `<ul class="sidebar-group-list">` colapsable en el Sidebar sin alterar el App One Shell móvil.

## 2. Alcance
- `SuperAdminCuentaController` (`GET /super-admin/cuenta-roles`, `POST /super-admin/cuenta-roles/perfil`) bajo `['auth', 'bitacora_admin']`.
- Validación de contraseña actual al cambiar correo o contraseña + auditoría en `BitacoraService`.
- Vista `Pages/SuperAdmin/CuentaRoles.jsx` con formulario de perfil + matriz de permisos de los 4 roles (`Super-Admin Técnico`, `Dueño / Admin`, `Barbero`, `Cliente`) + directorio de cuentas administrativas por barbería.
- Grupo colapsable `<ul>` en `AppSidebar.jsx` (sin tocar `BottomTabBar.jsx`).
