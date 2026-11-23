# Spec 004: Módulo de Citas del Cliente (Asistente de 3 Pasos)

## 1. Objetivo
Migrar `controllers/CitaController.php`, `controllers/APIController.php` (`index`, `guardar`), `views/cita/index.php` y toda la lógica interactiva de `src/js/app.js` a `Pages/Cita/Index.jsx` conectando las llamadas con **Laravel Wayfinder** y **SweetAlert2**.

## 2. Rutas y Endpoints

| Método | URI | Controlador | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/cita` | `CitaController@index` | Renderiza `Pages/Cita/Index.jsx` (protegido por middleware `auth`). |
| `GET` | `/api/servicios` | `APIController@index` | Devuelve JSON con todos los registros de `servicios`. *(Además se pueden hidratar inicialmente como prop en `/cita`)*. |
| `POST` | `/api/citas` | `APIController@guardar` | Recibe `fecha`, `hora`, `usuarioId` y `servicios`, crea la cita en `citas` y sus relaciones en `citasServicios`, y responde `{ resultado: true, id: ... }`. |

## 3. Comportamiento Exacto del Asistente (`Pages/Cita/Index.jsx`)

1. **Encabezado y Barra:**
   - `<h1 class="nombre-pagina">Crear Nueva Cita</h1>`
   - `<p class="descripcion-pagina">Elige tus servicios y coloca tus datos</p>`
   - Componente `<Barra />` (`Hola: {nombre}` + botón `Cerrar Sesión`).
2. **Navegación por Tabs (`.tabs`) y Paginador (`.paginacion`):**
   - 3 botones en `.tabs`: `Servicios` (paso 1), `Información Cita` (paso 2), `Resumen` (paso 3). El paso activo lleva la clase `.actual`.
   - En paso 1: botón `#anterior` lleva clase `.ocultar` (`visibility: hidden`); botón `#siguiente` visible.
   - En paso 2: ambos botones visibles.
   - En paso 3: botón `#siguiente` lleva clase `.ocultar`; botón `#anterior` visible.
3. **Paso 1 (`#paso-1` - Servicios):**
   - Grid `.listado-servicios` con tarjetas `.servicio`.
   - Al hacer clic en un servicio, alterna su presencia en `cita.servicios` y aplica/quita la clase `.seleccionado`.
   - Cada tarjeta muestra `<p class="nombre-servicio">{nombre}</p>` y `<p class="precio-servicio">${precio}</p>`.
4. **Paso 2 (`#paso-2` - Información Cita):**
   - Campo `Nombre`: deshabilitado (`disabled`) con el nombre completo del usuario autenticado.
   - Campo `Fecha` (`type="date"`, `min={hoy}`):
     - Si el día seleccionado es domingo (`new Date(valor).getUTCDay() === 0`), limpia la fecha y muestra alerta de error temporal (3 segundos) dentro de `.formulario`: `"Domingos No Trabajamos, Elije otro día de Lunes a Sábado"`.
   - Campo `Hora` (`type="time"`):
     - Extrae la hora (` parseInt(valor.split(':')[0], 10)`). Si `hora < 10 || hora > 19`, limpia la hora y muestra alerta de error temporal (3 segundos) dentro de `.formulario`: `"Hora No Válida"`.
5. **Paso 3 (`#paso-3` - Resumen `.contenido-resumen`):**
   - Si falta `fecha`, `hora` o `cita.servicios.length === 0`: muestra alerta de error permanente dentro de `.contenido-resumen`: `"Faltan datos de Servicios, Fecha u Hora"`.
   - Si los datos están completos:
     - Muestra `<h3>Resumen de Servicios</h3>` y cada servicio en `.contenedor-servicio` con `<p>{nombre}</p>` y `<p><span>Precio:</span> ${precio}</p>`.
     - Muestra `<h3>Resumen de Cita</h3>`, `<p><span>Nombre:</span> {nombre}</p>`, `<p><span>Fecha:</span> {fechaFormateada}</p>` (en `es-MX`: `weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'`) y `<p><span>Hora:</span> {hora} Horas</p>`.
     - Botón `<button class="boton" onClick={reservarCita}>Reservar Cita</button>`.
6. **Confirmación con SweetAlert2:**
   - Envía petición `POST` a la ruta generada por Wayfinder (`APIController.guardar.url()`).
   - Al recibir `{ resultado: ... }` exitoso, muestra:
     ```js
     Swal.fire({
         icon: 'success',
         title: 'Cita Creada',
         text: 'Tu cita fue creada correctamente',
         button: 'OK'
     })
     ```
     y reinicia el asistente.
   - Si ocurre un error, muestra `Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un error al guardar la cita' })`.
