# Spec 010: Guía Visual de Visagismo (Tipo de Rostro) + Catálogo Fotográfico de Barbería

## 1. Objetivo
Ayudar al cliente a elegir el corte que mejor le favorece **sin reconocimiento facial invasivo**, mediante una **Guía Visual Interactiva de Tipo de Rostro** (siluetas SVG claras con proporciones/márgenes de cada rostro: `Redondo`, `Ovalado`, `Cuadrado`, `Alargado`, `Diamante`) y un **catálogo fotográfico editorial de cortes actuales de barbería** poblado mediante `CatalogoBarberiaSeeder`.

## 2. Evolución de Esquema (`servicios` — Migración Aditiva)
Archivo: `database/migrations/2026_01_01_000008_add_visagismo_to_servicios_table.php`
- `tipos_rostro`: `json('tipos_rostro')->nullable()->after('activo')` — arreglo de claves (`redondo`, `ovalado`, `cuadrado`, `alargado`, `diamante`).
- `recomendacion_rostro`: `string('recomendacion_rostro', 255)->nullable()->after('tipos_rostro')` — consejo breve de por qué el corte estiliza o equilibra esos rostros.

## 3. Experiencia en `/cita` (Paso 1) y `/servicios`
1. **Componente `Components/GuiaTipoRostro.jsx`:**
   - 5 tarjetas táctiles con silueta SVG y guías de proporción (ancho de pómulos/mejillas vs largo del rostro y mandíbula): `Redondo`, `Ovalado`, `Cuadrado`, `Alargado`, `Diamante`, más botón `Ver todos`.
   - Al elegir un tipo de rostro, despliega una tarjeta de asesoría artesanal explicando **qué márgenes/cortes le favorecen** (por ejemplo, para **Rostro Redondo**: *laterales rebajados en fade + volumen superior + barba perfilada en ángulo para alargar y estilizar visualmente el rostro*) y **filtra/resalta automáticamente** los servicios recomendados con el badge **`Ideal para rostro {tipo}`**.
2. **Administración (`ServicioFormulario.jsx`):**
   - Permite al administrador marcar checkboxes de `tipos_rostro` recomendados y redactar `recomendacion_rostro` al crear o editar cualquier servicio.
3. **Seeder (`CatalogoBarberiaSeeder.php`):**
   - Pobla 8 servicios profesionales de barbería con sus fotografías editoriales generadas en `storage/app/public/servicios/`, precios, duraciones, descripciones y etiquetas de visagismo.
