<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu cuenta - App Salón</title>
</head>
<body style="margin:0;padding:0;background-color:#141210;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5efe6;">
    @php
        $enlace = url('/confirmar-cuenta?token=' . urlencode($token));
    @endphp
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#141210;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#1f1b17;border:1px solid #4a3a26;border-radius:16px;overflow:hidden;">
                    <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(135deg,#28221c 0%,#181512 100%);border-bottom:1px solid #3c3022;">
                            <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a259;font-weight:700;">
                                EST. BARBER SHOP
                            </p>
                            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#f5efe6;font-weight:700;">
                                App Salón
                            </h1>
                            <p style="margin:6px 0 0;font-size:13px;color:#b9afa1;">
                                Corte Clásico · Barba · Estilo Artesanal
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <h2 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#f5efe6;">
                                ¡Hola, {{ $nombre }}!
                            </h2>
                            <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#e4ddd2;">
                                Has creado tu cuenta en <strong style="color:#d4a259;">App Salón</strong>. Para comenzar a reservar tus citas, elegir tu barbero favorito y disfrutar de nuestros servicios, solo debes confirmar tu correo presionando el siguiente botón:
                            </p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:26px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $enlace }}" style="display:inline-block;padding:14px 32px;background-color:#d4a259;color:#141210;text-decoration:none;font-size:15px;font-weight:700;border-radius:10px;letter-spacing:0.3px;">
                                            Confirmar mi Cuenta
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#b9afa1;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                            </p>
                            <p style="margin:0 0 22px;font-size:12px;word-break:break-all;color:#d4a259;">
                                <a href="{{ $enlace }}" style="color:#d4a259;text-decoration:underline;">{{ $enlace }}</a>
                            </p>

                            <p style="margin:0;font-size:13px;line-height:1.5;color:#9b9184;border-top:1px dashed #3c3022;padding-top:16px;">
                                Si tú no solicitaste esta cuenta, puedes hacer caso omiso de este mensaje.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:16px 32px;text-align:center;background-color:#161310;border-top:1px solid #2e261d;">
                            <p style="margin:0;font-size:12px;color:#8e8477;">
                                © {{ date('Y') }} App Salón · Barbería. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
