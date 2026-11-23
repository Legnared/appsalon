<!DOCTYPE html>
<html lang="es">
<body>
    <p><strong>Hola {{ $nombre }}</strong>, has creado tu cuenta en AppSalon. Solo debes confirmarla presionando el siguiente enlace:</p>
    <p>Presiona aquí: <a href="{{ url('/confirmar-cuenta?token=' . urlencode($token)) }}">Confirma Cuenta</a></p>
    <p>Si tú no solicitaste esta cuenta, haz caso omiso de este mensaje.</p>
</body>
</html>
