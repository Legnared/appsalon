# Tareas 006: Motor de Pagos Multi-Banco (Tarjeta + Terminal POS)

- [ ] **T006.1:** Crear migración `create_pagos_table` y modelo Eloquent `App\Models\Pago` (relacionado con `Cita` y `Usuario`).
- [ ] **T006.2:** Crear archivo de configuración `config/payments.php` y variables `.env.example` para drivers bancarios y terminal POS.
- [ ] **T006.3:** Implementar `PaymentGatewayInterface`, DTOs (`CardPaymentRequestData`, `TerminalPaymentRequestData`, `PaymentResultData`), `PaymentManager`, `SandboxBankGateway` y `GenericRestBankGateway`.
- [ ] **T006.4:** Integrar el procesamiento de pago dentro de `APIController@guardar` y crear `PagoController@cobrarEnTerminal` + `PagoWebhookController@handle`, regenerando rutas con **Wayfinder**.
- [ ] **T006.5:** Crear estilos SASS `resources/scss/layout/_pagos.scss` (respetando variables `$azul`, `$negro`, `$blanco`, `$verde`, `$rojo`) y registrarlo en `resources/scss/layout/_index.scss`.
- [ ] **T006.6:** Crear componente `resources/js/Components/MetodoPagoSelector.jsx` e integrarlo en el Paso 3 (Resumen) de `Pages/Cita/Index.jsx`.
- [ ] **T006.7:** Integrar visualización de estado de pago y botón `Cobrar en Terminal POS` dentro de `Pages/Admin/Index.jsx`.
