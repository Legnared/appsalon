# Spec 005: Panel de Administración de Citas y CRUD de Servicios

## 1. Objetivo
Migrar `controllers/AdminController.php`, `controllers/ServicioController.php`, `src/js/buscador.js`, `views/admin/index.php` y `views/servicios/*` a Laravel 12 + Inertia React + **Wayfinder**, protegiendo todas las rutas con el middleware de administrador (`isAdmin`).

## 2. Rutas y Contratos

| Método | URI | Controlador | Vista Inertia / Acción |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin` | `AdminController@index` | `Pages/Admin/Index.jsx` |
| `POST` | `/api/eliminar` | `APIController@eliminar` | Elimina cita y redirige `back()` |
| `GET` | `/servicios` | `ServicioController@index` | `Pages/Servicios/Index.jsx` |
| `GET` | `/servicios/crear` | `ServicioController@showCrear` | `Pages/Servicios/Crear.jsx` |
| `POST` | `/servicios/crear` | `ServicioController@crear` | Valida, crea servicio y redirige a `/servicios` |
| `GET` | `/servicios/actualizar` | `ServicioController@showActualizar` | `Pages/Servicios/Actualizar.jsx` (`?id={id}`) |
| `POST` | `/servicios/actualizar` | `ServicioController@actualizar` | Valida, actualiza servicio y redirige a `/servicios` |
| `POST` | `/servicios/eliminar` | `ServicioController@eliminar` | Elimina servicio y redirige a `/servicios` |

## 3. Reglas de Negocio y Comportamiento Visual

### 3.1 Panel de Administración (`GET /admin` → `Pages/Admin/Index.jsx`)
- Lee `?fecha=YYYY-MM-DD` (por defecto `date('Y-m-d')`).
- Valida la fecha con `checkdate(mes, dia, anio)`; si es inválida, aborta con 404.
- Consulta las citas de la fecha seleccionada junto con su cliente (`usuarios`) y sus servicios (`servicios`).
- En la vista:
  - Muestra `<h1 class="nombre-pagina">Panel de Administración</h1>` y `<Barra />` (con `.barra-servicios`: `Ver Citas`, `Ver Servicios`, `Nuevo Servicio`).
  - Buscador por fecha (`<input type="date" id="fecha" name="fecha" value={fecha} />`): al cambiar de fecha, navega vía Inertia + Wayfinder a `AdminController.index.url({ query: { fecha: nuevaFecha } })`.
  - Si no hay citas para esa fecha: muestra `<h2>No Hay Citas en esta fecha</h2>`.
  - Lista `<ul class="citas">` dentro de `#citas-admin`:
    - Muestra `ID`, `Hora`, `Cliente`, `Email`, `Teléfono`.
    - Encabezado `<h3>Servicios</h3>` y cada servicio contratado en `<p class="servicio">{servicio.nombre} {servicio.precio}</p>`.
    - Suma total de la cita en `<p class="total">Total: <span>$ {total}</span></p>`.
    - Formulario para eliminar cita conectado a `APIController.eliminar` con botón `.boton-eliminar` (`Eliminar`).

### 3.2 CRUD de Servicios (`/servicios/*`)
- **Listado (`Pages/Servicios/Index.jsx`):**
  - Muestra `<ul class="servicios">`, cada `<li>` con `Nombre: <span>{nombre}</span>`, `Precio: <span>${precio}</span>` y `.acciones` con enlace `.boton` (`Actualizar` → `/servicios/actualizar?id={id}`) y botón `.boton-eliminar` (`Borrar` → `POST /servicios/eliminar`).
- **Crear (`Pages/Servicios/Crear.jsx`) y Actualizar (`Pages/Servicios/Actualizar.jsx`):**
  - Reutilizan `Components/ServicioFormulario.jsx` (`nombre` y `precio`).
  - Mensajes de validación exactos:
    - Si falta `nombre`: `"El Nombre del Servicio es Obligatorio"`
    - Si falta `precio`: `"El Precio del Servicio es Obligatorio"`
    - Si `precio` no es numérico: `"El precio no es válido"`
  - En `/servicios/actualizar`, si `id` no es numérico o no existe, redirige o ignora de forma segura tal como `if(!is_numeric($_GET['id'])) return;`.
