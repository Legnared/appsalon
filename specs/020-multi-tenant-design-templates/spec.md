# Spec 020: 3 Plantillas de Diseño Seleccionables por Barbería (Multi-Tenant)

## 1. Objetivo
Permitir que cada barbería elija entre **3 plantillas visuales completas** (`rustico_editorial`, `moderno_urbano`, `boutique_claro`) almacenadas en `tenants.configuracion_extra['tema_diseno']`, combinables con su color de acento y logo, sin afectar en absoluto el diseño original de Danny's BarberShop (`rustico_editorial`).

## 2. Plantillas
1. **`rustico_editorial` (Por defecto):** Carbón/cuero + *Playfair Display* (Danny's BarberShop intacto).
2. **`moderno_urbano` (Glass Dark):** Tipografía geométrica *Poppins*, tarjetas estilo cristal ahumado y bordes rectos modernos.
3. **`boutique_claro` (Elegante Light):** Fondo marfil/blanco luminoso, texto carbón de alto contraste y tarjetas claras con sombra suave.
