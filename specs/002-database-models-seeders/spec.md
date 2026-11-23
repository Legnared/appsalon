# Spec 002: Base de Datos, Migraciones, Modelos Eloquent y Seeders

## 1. Objetivo
Replicar el esquema exacto de `appsalon_mvc.sql` mediante migraciones de Laravel 12, configurar los 4 modelos Eloquent del dominio (`Usuario`, `Servicio`, `Cita`, `CitaServicio`) y poblar el catálogo oficial de 11 servicios mediante `ServicioSeeder`.

## 2. Esquema de Tablas y Reglas

### 2.1 Tabla `usuarios`
- `id`: PK auto-incremental (`int` / `bigint` compatible).
- `nombre`: `string('nombre', 60)->nullable()`
- `apellido`: `string('apellido', 60)->nullable()`
- `email`: `string('email', 60)->nullable()->unique()` *(compatible con los 30 chars originales y correos estándar)*
- `password`: `string('password', 60)->nullable()`
- `telefono`: `string('telefono', 10)->nullable()`
- `admin`: `boolean('admin')->default(false)->nullable()`
- `confirmado`: `boolean('confirmado')->default(false)->nullable()`
- `token`: `string('token', 15)->nullable()`
- Sin columnas `timestamps` (`public $timestamps = false;`) para mantener compatibilidad 1:1 con la base de datos `appsalon_mvc` existente.

### 2.2 Tabla `servicios`
- `id`: PK auto-incremental.
- `nombre`: `string('nombre', 60)->nullable()`
- `precio`: `decimal('precio', 5, 2)->nullable()`
- `public $timestamps = false;`

### 2.3 Tabla `citas`
- `id`: PK auto-incremental.
- `fecha`: `date('fecha')->nullable()`
- `hora`: `time('hora')->nullable()`
- `usuarioId`: FK a `usuarios(id)` con `ON DELETE SET NULL ON UPDATE SET NULL`.
- `public $timestamps = false;`

### 2.4 Tabla `citasServicios`
- `id`: PK auto-incremental.
- `citaId`: FK a `citas(id)` con `ON DELETE SET NULL ON UPDATE SET NULL`.
- `servicioId`: FK a `servicios(id)` con `ON DELETE SET NULL ON UPDATE SET NULL`.
- `public $timestamps = false;`

## 3. Catálogo Oficial de Servicios (`ServicioSeeder`)
Debe insertar o actualizar los 11 registros exactos de `appsalon_mvc.sql`:
1. `Corte de Cabello Mujer ACTUALIZADO` (`120.00`)
2. `Corte de Cabello Hombre` (`80.00`)
3. `Corte de Cabello Niño` (`60.00`)
4. `Peinado Mujer` (`80.00`)
5. `Peinado Hombre` (`60.00`)
6. `Peinado Niño` (`60.00`)
7. `Corte de Barba` (`60.00`)
8. `Tinte Mujer` (`300.00`)
9. `Uñas` (`400.00`)
10. `Lavado de Cabello` (`50.00`)
11. `Tratamiento Capilar` (`150.00`)

## 4. Criterios de Aceptación
- El modelo `App\Models\Usuario` extiende `Illuminate\Foundation\Auth\User as Authenticatable` y está configurado en `config/auth.php` como el provider `users`.
- `Cita::with(['usuario', 'servicios'])` resuelve correctamente las relaciones usando las llaves foráneas `usuarioId`, `citaId` y `servicioId` sobre la tabla pivote `citasServicios`.
