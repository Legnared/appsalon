# Plan Técnico 005: Panel de Administración y CRUD de Servicios

## 1. Archivos a Crear

```text
app/
└── Http/
    └── Controllers/
        ├── AdminController.php
        └── ServicioController.php
resources/
└── js/
    └── Pages/
        ├── Admin/
        │   └── Index.jsx
        └── Servicios/
            ├── Index.jsx
            ├── Crear.jsx
            └── Actualizar.jsx
```

## 2. Consultas Eloquent vs SQL Plano Original
En el proyecto legacy, `AdminController` hacía un `LEFT OUTER JOIN` plano con `AdminCita::SQL($consulta)` e iteraba fila por fila en la vista usando `esUltimo($actual, $proximo)` para agrupar servicios de una misma cita y acumular `$total`.
En Laravel 12:
- Podemos consultar con Eloquent `Cita::with(['usuario', 'servicios'])->where('fecha', $fecha)->get()` y transformar cada cita con su arreglo `servicios` y su `total` calculado, manteniendo **exactamente el mismo HTML y clases CSS** (`#citas-admin > ul.citas > li`, `<p class="servicio">`, `<p class="total">Total: <span>$ {total}</span></p>`).
