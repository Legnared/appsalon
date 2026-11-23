# Plan Técnico 002: Base de Datos, Migraciones, Modelos y Seeders

## 1. Archivos a Crear / Configurar

```text
database/
├── migrations/
│   ├── 0001_01_01_000001_create_usuarios_table.php
│   ├── 0001_01_01_000002_create_servicios_table.php
│   ├── 0001_01_01_000003_create_citas_table.php
│   └── 0001_01_01_000004_create_citas_servicios_table.php
└── seeders/
    ├── DatabaseSeeder.php
    └── ServicioSeeder.php
app/
└── Models/
    ├── Usuario.php
    ├── Servicio.php
    ├── Cita.php
    └── CitaServicio.php
```

## 2. Diseño de Modelos Eloquent

### `App\Models\Usuario`
- `protected $table = 'usuarios';`
- `public $timestamps = false;`
- `protected $fillable = ['nombre', 'apellido', 'email', 'password', 'telefono', 'admin', 'confirmado', 'token'];`
- `protected $hidden = ['password', 'token'];`
- `protected $casts = ['admin' => 'boolean', 'confirmado' => 'boolean', 'password' => 'hashed'];`
- Relación: `public function citas() { return $this->hasMany(Cita::class, 'usuarioId'); }`
- Accessor `nombreCompleto`: `trim("{$this->nombre} {$this->apellido}")`.

### `App\Models\Servicio`
- `protected $table = 'servicios';`
- `public $timestamps = false;`
- `protected $fillable = ['nombre', 'precio'];`

### `App\Models\Cita`
- `protected $table = 'citas';`
- `public $timestamps = false;`
- `protected $fillable = ['fecha', 'hora', 'usuarioId'];`
- Relaciones:
  - `usuario()`: `belongsTo(Usuario::class, 'usuarioId')`
  - `servicios()`: `belongsToMany(Servicio::class, 'citasServicios', 'citaId', 'servicioId')`

### `App\Models\CitaServicio`
- `protected $table = 'citasServicios';`
- `public $timestamps = false;`
- `protected $fillable = ['citaId', 'servicioId'];`

## 3. Compatibilidad con Base de Datos Existente
Las migraciones verificarán `Schema::hasTable(...)` o se ejecutarán de forma segura para ser 100% compatibles tanto con una base de datos `appsalon_mvc` recién creada como con una ya poblada.
