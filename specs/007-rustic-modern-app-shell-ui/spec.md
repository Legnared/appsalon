# Spec 007: Estética Barbería Moderna-Rústica + Mobile-First Native-like App Shell

## 1. Objetivo
Evolucionar la interfaz de **AppSalon** hacia una experiencia **Barbería Moderna-Rústica** (carbón/nogal oscuro, acentos latón/ámbar `#d4a259`, cuero cálido y tipografía editorial combinada con `Poppins`) junto con un patrón **Mobile-First Native-like App Shell** (sin PWA ni Service Worker), preservando todas las rutas, reglas de negocio y clases funcionales del sistema.

## 2. Requisitos de Diseño y UX

### R1. Estética Barbería Moderna-Rústica (SASS Modular)
- **Paleta:**
  - Fondo principal carbón/madera oscura: `#141210`
  - Superficies de tarjetas (cuero/nogal): `#1f1b17` y `#26211c`
  - Acento artesanal latón/dorado bruñido: `#d4a259` (hover `#e2b46b`)
  - Texto marfil cálido: `#f5efe6` y secundario arena `#b9afa1`
  - Estados: éxito verde bosque `#2f8f46`, peligro carmesí `#b83232`, info acero `#0da6f3`
- **Tipografía:** Google Fonts `Playfair Display` (títulos de marca / encabezados editoriales) + `Poppins` (UI, formularios y datos).
- **Split-screen (`.contenedor-app`):** En escritorio (`>= 768px`), panel izquierdo con `/img/1.webp` (fallback `/img/1.jpg`), viñeta cálida artesanal y placa de marca (`APP SALÓN · BARBERÍA`); panel derecho con scroll estilizado en latón.

### R2. Patrón App Shell Unificado (Sidebar Escritorio + Mobile-First Native-like App Shell `< 768px`)
- **Rutas Públicas (`Login`, `Registro`, `Olvidé`, `Reestablecer`):** Mantienen el split-screen con `/img/1.webp` y la placa `APP SALÓN · BARBERÍA`.
- **Rutas Autenticadas (App Shell Unificado):**
  - **Escritorio (`>= 768px`):** Sidebar lateral fijo (`AppSidebar.jsx`) con cabecera artesanal de marca, navegación vertical por rol (`Citas`, `Barberos`, `Clientes`, `Servicios` / `Mi Agenda` / `Nueva Cita`) y pie de usuario con **Cerrar Sesión protegido con confirmación SweetAlert2**.
  - **Móvil (`< 768px`):**
    - `MobileTopBar.jsx` compacta en la parte superior con marca, saludo breve y botón de salida protegido con confirmación SweetAlert2.
    - `BottomTabBar.jsx` fija abajo con `backdrop-filter: blur(14px)`, `.pb-safe` (`env(safe-area-inset-bottom)`) y **5 ítems simétricos** en Admin (`Citas`, `Barberos`, `+ Nuevo` al centro, `Clientes`, `Servicios`), sin botón de cierre de sesión abajo para evitar toques accidentales.
- **Viewport y Safe Areas:** `viewport-fit=cover`, `theme-color="#141210"`, `<link rel="apple-touch-icon" href="/img/icono.png">`, `.pb-safe` y `.no-scrollbar`.
- **Ergonomía Táctil:**
  - Botones, inputs y tabs con `min-height: 44px`, `touch-action: manipulation` y micro-feedback `active: transform: scale(0.97)`.
- **Tarjetas Rústico-Modernas en Panel Admin y Servicios:**
  - En `Pages/Admin/Index.jsx`: resumen del día (conteo de citas e ingreso total estimado del día), buscador por fecha en tarjeta compacta y listado de citas como **cards estructuradas** (badge de hora en latón, datos del cliente, chips de servicios, total resaltado y acción de eliminar).
  - En `Pages/Servicios/Index.jsx`: tarjetas limpias con precio destacado en latón y acciones táctiles (`Actualizar` / `Borrar`).
- **Widget Discreto de Accesibilidad (`Components/AccessibilityToggle.jsx`):**
  - Botón flotante discreto `A+ / A` para alternar entre tamaño de texto normal y grande (`html.texto-grande`), persistido en `localStorage`.

## 3. Criterios de Aceptación
- En escritorio (`>= 768px`) se mantiene el layout dividido con imagen lateral `1.webp` y panel rústico-moderno sin barra inferior.
- En móvil (`< 768px`) aparece la barra inferior fija (`BottomTabBar`) respetando `safe-area-inset-bottom` y sin tapar el contenido final de la página.
- Toda navegación de `BottomTabBar` usa rutas generadas por **Laravel Wayfinder**.
- `npm run build` compila limpio sin errores.
