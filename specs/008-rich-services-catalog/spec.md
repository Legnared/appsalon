# Spec 008: Catálogo Enriquecido de Servicios (Descripción, Fotografía, Duración y Estado Activo)

## 1. Objetivo
Enriquecer el módulo de servicios de **AppSalon** para que cada servicio de barbería cuente con **descripción detallada**, **fotografía del corte/servicio**, **duración estimada en minutos** y **estado activo/oculto**, priorizando la edición y activación/desactivación sobre el borrado directo (conservando la eliminación protegida con confirmación SweetAlert2).

## 2. Evolución de Esquema (`servicios` — Migración Aditiva)
Sin modificar migraciones históricas, se agrega la migración `add_detalles_to_servicios_table`:
- `descripcion`: `text()->nullable()`
- `imagen`: `string('imagen', 255)->nullable()` (ruta relativa en disco `public`, ej. `servicios/uuid.webp`)
- `duracion_minutos`: `unsignedSmallInteger('duracion_minutos')->default(30)`
- `activo`: `boolean('activo')->default(true)`

## 3. Reglas de Negocio y UX
1. **Gestión de Imágenes (`Storage::disk('public')`):**
   - Formatos admitidos: `jpg`, `jpeg`, `png`, `webp` (máximo `4 MB`).
   - Al subir nueva foto en edición o marcar `eliminar_imagen = true`, se borra el archivo previo del disco `public` para no dejar basura.
   - El modelo `Servicio` expone el atributo `imagen_url` (`/storage/{imagen}` o `null`).
2. **Panel de Servicios (`/servicios`):**
   - Cada tarjeta muestra miniatura de la foto (o ícono artesanal si aún no tiene foto), nombre, precio en latón, duración (`30 min`), descripción y badge `Activo` / `Oculto`.
   - Acción principal: **Editar** (`/servicios/actualizar?id={id}`).
   - Acción rápida: **Ocultar / Activar** (`POST /servicios/toggle-activo`) con Partial Reload sin recargar la página.
   - Acción secundaria: **Eliminar** protegida con confirmación **SweetAlert2**.
3. **Asistente de Citas (`/cita` — Paso 1):**
   - Muestra únicamente servicios `activo = true`, presentando su fotografía, nombre, descripción breve, duración estimada y precio.
