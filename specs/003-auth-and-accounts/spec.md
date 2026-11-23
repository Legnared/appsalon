# Spec 003: Autenticación, Registro, Confirmación y Recuperación de Password

## 1. Objetivo
Migrar `controllers/LoginController.php`, `classes/Email.php`, `includes/funciones.php` (`isAuth`, `isAdmin`) y las 6 vistas de `views/auth/*` a Laravel 12 + Inertia React + **Wayfinder**, conservando íntegramente las validaciones, textos de alerta, flujo de tokens y redirecciones por rol.

## 2. Rutas y Contratos

| Método | URI | Acción en `AuthController` | Nombre Ruta |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `showLogin` | `login` |
| `POST` | `/` | `login` | `login.attempt` |
| `GET\|POST` | `/logout` | `logout` | `logout` |
| `GET` | `/crear-cuenta` | `showCrear` | `register` |
| `POST` | `/crear-cuenta` | `crear` | `register.store` |
| `GET` | `/mensaje` | `mensaje` | `register.message` |
| `GET` | `/confirmar-cuenta` | `confirmar` | `register.confirm` |
| `GET` | `/olvide` | `showOlvide` | `password.request` |
| `POST` | `/olvide` | `olvide` | `password.email` |
| `GET` | `/reestablecer` | `showRecuperar` | `password.reset` |
| `POST` | `/reestablecer` | `recuperar` | `password.update` |

## 3. Reglas de Negocio y Mensajes Exactos

### 3.1 Login (`GET /`, `POST /` → `Pages/Auth/Login.jsx`)
- Mensajes de validación si faltan campos:
  - `"El email es Obligatorio"`
  - `"El Password es Obligatorio"`
- Si no existe usuario con ese `email`: alerta error `"Usuario no encontrado"`.
- Si existe pero `!Hash::check($password, $usuario->password)` o `!$usuario->confirmado`: alerta error `"Password Incorrecto o tu cuenta no ha sido confirmada"`.
- Si es válido: inicia sesión (`Auth::login($usuario)`), regenera sesión y redirige:
  - Si `$usuario->admin == 1` → `/admin`
  - Si `$usuario->admin == 0` → `/cita`

### 3.2 Crear Cuenta (`GET /crear-cuenta`, `POST /crear-cuenta` → `Pages/Auth/CrearCuenta.jsx`)
- Campos: `nombre`, `apellido`, `telefono`, `email`, `password`.
- Mensajes de validación:
  - `"El Nombre es Obligatorio"`
  - `"El Apellido es Obligatorio"`
  - `"El Email es Obligatorio"`
  - `"El Password es Obligatorio"`
  - `"El password debe contener al menos 6 caracteres"`
  - Si el email ya existe en `usuarios`: `"El Usuario ya esta registrado"`
- Genera `token = uniqid()`, hashea `password`, envía correo `"Confirma tu cuenta"` con enlace a `/confirmar-cuenta?token={token}`, guarda el usuario con `admin = 0`, `confirmado = 0` y redirige a `/mensaje`.

### 3.3 Mensaje y Confirmar Cuenta (`GET /mensaje`, `GET /confirmar-cuenta`)
- `/mensaje` (`Pages/Auth/Mensaje.jsx`): muestra `<h1 class="nombre-pagina">Confirma tu cuenta</h1>` y `<p class="descripcion-pagina">Hemos enviado las instrucciones para confirmar tu cuenta a tu e-mail.</p>`.
- `/confirmar-cuenta?token=...` (`Pages/Auth/ConfirmarCuenta.jsx`):
  - Si el token no existe: alerta error `"Token No Válido"`.
  - Si existe: actualiza `confirmado = 1`, `token = null` y muestra alerta éxito `"Cuenta Comprobada Correctamente"`.

### 3.4 Olvidé y Reestablecer Password (`/olvide`, `/reestablecer`)
- `POST /olvide`:
  - Valida `"El email es Obligatorio"`.
  - Si existe usuario con ese `email` y `confirmado == 1`: genera nuevo `token = uniqid()`, guarda, envía correo `"Reestablece tu contraseña"` con enlace a `/reestablecer?token={token}` y alerta éxito `"Revisa tu email"`.
  - En caso contrario: alerta error `"El Usuario no existe o no esta confirmado"`.
- `GET /reestablecer?token=...`:
  - Si falta token: alerta error `"Token no recibido o está vacío"`, `error = true` (oculta el `<form>`).
  - Si no coincide con ningún usuario: alerta error `"Token No Válido"`, `error = true` (oculta el `<form>`).
- `POST /reestablecer?token=...`:
  - Valida `"El Password es obligatorio"` y `"El Password debe tener al menos 6 caracteres"`.
  - Actualiza `password` hasheado, limpia `token = null`, guarda y redirige a `/`.

### 3.5 Middlewares de Autorización
- `EnsureUserIsAuthenticated` (`isAuth`): si `!Auth::check()`, redirige a `/`.
- `EnsureUserIsAdmin` (`isAdmin`): si `!Auth::check() || !Auth::user()->admin`, redirige a `/`.
