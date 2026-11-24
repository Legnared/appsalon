# Tareas 013: Pagos Omnicanal (Anticipo/100%, Mercado Pago, SPEI y Point)

- [x] **T013.1:** Crear migración aditiva `add_omnichannel_fields_to_pagos_table` y actualizar `Pago.php` y `config/payments.php`.
- [x] **T013.2:** Implementar `MercadoPagoGateway` (Checkout Pro Link + Point Integrations) y registrarlo en `config/payments.php`.
- [x] **T013.3:** Actualizar `CitaController`, `APIController@guardar`, `PagoController@cobrarEnTerminal` y `AdminController` para soportar Anticipo/100%, SPEI, Point y Efectivo.
- [x] **T013.4:** Actualizar `MetodoPagoSelector.jsx`, `Pages/Cita/Index.jsx` y `Pages/Admin/Index.jsx` con selector Anticipo/100%, ficha SPEI + botón WhatsApp, y liquidación de saldo pendiente.
- [x] **T013.5:** Validar PHP y compilar con Vite (listo para `php artisan migrate` y despliegue en Railway).
