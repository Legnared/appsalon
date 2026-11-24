# Tareas 015: Docker y Despliegue Seguro en Railway

- [x] **T015.1:** Configurar `trustProxies(at: '*')` en `bootstrap/app.php` y `URL::forceScheme('https')` en `AppServiceProvider.php`.
- [x] **T015.2:** Documentar configuración sin costo adicional en `.env.example` (compatible con `MAIL_MAILER=log` o API HTTPS gratuita).
- [x] **T015.3:** Crear `.dockerignore`, `docker/apache-vhost.conf`, `docker/entrypoint.sh`, `Dockerfile` (multi-stage con PHP 8.3 + Node 20 + Wayfinder) y `railway.json`.
- [x] **T015.4:** Respaldar las 8 fotos editoriales del catálogo en `docker/seed-media/servicios/` para autosembrado cuando el Volume de Railway inicie vacío.
- [x] **T015.5:** Validar sintaxis PHP y revisar los archivos Docker antes de hacer commit y push.
- [ ] **T015.6:** (Con autorización explícita) Crear proyecto nuevo aislado `dannys-barbershop` en Railway + MySQL + Volume, configurar variables y desplegar sin tocar el proyecto existente.
