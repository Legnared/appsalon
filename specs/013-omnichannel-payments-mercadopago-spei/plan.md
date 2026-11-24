# Plan Técnico 013: Pagos Omnicanal (Mercado Pago + SPEI + Point + Efectivo)

- `database/migrations/2026_01_01_000012_add_omnichannel_fields_to_pagos_table.php`
- `config/payments.php` (driver `mercadopago`, configuración `spei`, `anticipo`, `whatsapp_negocio`)
- `app/Services/Payments/Drivers/MercadoPagoGateway.php` (Checkout Pro Preference + Point Integrations API)
- `app/Models/Pago.php` (`$fillable` y `$casts` actualizados)
- `app/Http/Controllers/APIController.php`, `PagoController.php`, `CitaController.php`, `AdminController.php`
- `resources/js/Components/MetodoPagoSelector.jsx` (selector Anticipo vs 100% + Tarjeta/MP, Transferencia SPEI con botón WhatsApp, Terminal Point/Efectivo)
- `resources/js/Pages/Cita/Index.jsx` y `resources/js/Pages/Admin/Index.jsx` (visualización de Anticipo/Saldo Pendiente, liquidación en mostrador y botón WhatsApp)
