# Plan Técnico 004: Módulo de Citas del Cliente

## 1. Archivos a Crear

```text
app/
└── Http/
    └── Controllers/
        ├── CitaController.php
        └── APIController.php
resources/
└── js/
    └── Pages/
        └── Cita/
            └── Index.jsx
```

## 2. Detalles de Implementación

- **`CitaController@index`:**
  - Retorna `Inertia::render('Cita/Index', ['serviciosIniciales' => Servicio::all()])`.
- **`APIController@index`:**
  - Retorna `response()->json(Servicio::all())` para mantener 100% compatibilidad con `GET /api/servicios`.
- **`APIController@guardar`:**
  - Soporta tanto payload JSON/Inertia como `FormData` (`servicios` como arreglo de IDs o string separado por comas `"1,2,3"` como en el `src/js/app.js` original).
  - Crea el registro en `citas` y los registros en `citasServicios` dentro de una transacción `DB::transaction`.
- **Formateo de Fecha en `Pages/Cita/Index.jsx`:**
  - Parsear `YYYY-MM-DD` de forma segura en UTC para evitar desfases de zona horaria y formatear con `toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })`.
