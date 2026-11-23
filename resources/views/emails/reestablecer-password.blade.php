<!DOCTYPE html>
<html lang="es">
<body>
    <p><strong>Hola {{ $nombre }}</strong>, has solicitado reestablecer tu contraseña. Sigue el siguiente enlace para hacerlo:</p>
    <p>Presiona aquí: <a href="{{ url('/reestablecer?token=' . urlencode($token)) }}">Reestablecer Contraseña</a></p>
    <p>Si tú no solicitaste este cambio, puedes ignorar este mensaje.</p>
</body>
</html>
