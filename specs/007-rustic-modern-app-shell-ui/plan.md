# Plan Técnico 007: Barbería Moderna-Rústica + Mobile-First App Shell

## 1. Archivos a Crear / Modificar

```text
resources/
├── views/
│   └── app.blade.php                     # viewport-fit=cover, apple-touch-icon, Playfair Display + Poppins
├── scss/
│   ├── base/
│   │   ├── _variables.scss               # Paleta rústica-moderna ($carbon, $cuero, $laton, $marfil)
│   │   ├── _globales.scss                # .pb-safe, .no-scrollbar, touch-action, html.texto-grande
│   │   ├── _tipografia.scss              # Encabezados editoriales + Poppins
│   │   └── _mixins.scss                  # Botones táctiles min-height 44px, active scale
│   ├── layout/
│   │   ├── _UI.scss                      # Split-screen artesanal, placa de marca, barra superior
│   │   ├── _admin.scss                   # Cards de citas, resumen diario, cards de servicios
│   │   ├── _servicios.scss               # Tarjetas de selección de servicios con acento latón
│   │   └── _resumen.scss                 # Resumen de cita con estética de ticket artesanal
│   └── componentes/
│       ├── _formulario.scss              # Inputs táctiles rústico-modernos
│       ├── _botones.scss                 # Botón latón/azul, cerrar sesión, eliminar
│       ├── _tabs.scss                    # Tabs táctiles
│       └── _bottom-nav.scss              # Nuevo: BottomTabBar móvil + AccessibilityToggle
└── js/
    ├── Layouts/
    │   └── MainLayout.jsx                # Placa de marca sobre 1.webp, padding inferior móvil, BottomTabBar y AccessibilityToggle
    ├── Components/
    │   ├── BottomTabBar.jsx              # Barra inferior nativa para móvil (<768px) con Wayfinder
    │   └── AccessibilityToggle.jsx       # Control flotante discreto A/A+
    └── Pages/
        ├── Admin/Index.jsx               # KPIs del día + cards de citas rústico-modernas
        └── Servicios/Index.jsx           # Cards de servicios rústico-modernas
```
