# Spec 023: Catálogo de Productos de Barbería (Cuidado Masculino)

## Objetivo
Permitir que cada barbería del SaaS suba y venda **productos de cuidado masculino** (pomadas, ceras, aceites de barba, bálsamos, shampoos, etc.) usando la misma modalidad práctica que los servicios: foto, precio, descripción, estado Activo/Oculto, stock opcional y pago flexible (Efectivo en Barbería, Transferencia SPEI, Terminal Point o Tarjeta/Mercado Pago).

## Alcance
1. **Migración aditiva (`servicios`):** columnas `tipo` (`'servicio'` | `'producto'`, default `'servicio'`) y `stock` (`unsignedInteger nullable`), índice compuesto `(tenant_id, tipo, activo)`.
2. **Panel Admin (`/servicios`):** filtros rápidos (`Todos` / `Servicios` / `Productos`), accesos directos `+ Nuevo Servicio` y `+ Nuevo Producto`, y formulario dinámico que oculta duración/visagismo y muestra stock opcional cuando `tipo = 'producto'`.
3. **Portal Cliente (`/cita`):** Paso 1 muestra **Servicios** (con guía de tipo de rostro) y debajo **Productos de Cuidado Masculino** (con foto, precio, stock y selección 1-clic) que se suman automáticamente al total y al resumen de pago.
