<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $asuntoFinal }}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1115;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5efe6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f1115;padding:36px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#181b21;border:1px solid {{ $colorPrimario }}55;border-top:4px solid {{ $colorPrimario }};border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.45);">
                    <tr>
                        <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(145deg,#21252e 0%,#14171c 100%);border-bottom:1px solid {{ $colorPrimario }}33;">
                            <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:{{ $colorPrimario }};font-weight:700;">
                                {{ $encabezado }}
                            </p>
                            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#ffffff;font-weight:700;letter-spacing:0.4px;">
                                {{ $marca }}
                            </h1>
                            <p style="margin:8px 0 0;font-size:13px;color:#b8bec9;">
                                {{ $tagline }}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:34px 32px 28px;">
                            <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;line-height:1.3;">
                                {{ $saludo }}
                            </h2>

                            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#dfe3ea;white-space:pre-line;">{{ $cuerpo }}</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 24px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $enlaceCta }}" style="display:inline-block;padding:15px 34px;background-color:{{ $colorPrimario }};color:#111317;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px;letter-spacing:0.3px;">
                                            {{ $botonTexto }}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#12151a;border:1px solid {{ $colorPrimario }}30;border-radius:12px;margin-top:18px;">
                                <tr>
                                    <td style="padding:14px 18px;font-size:12px;line-height:1.55;color:#a5adba;">
                                        <strong style="color:{{ $colorPrimario }};">Enlace directo:</strong><br>
                                        <a href="{{ $enlaceCta }}" style="color:#f5efe6;text-decoration:underline;word-break:break-all;">{{ $enlaceCta }}</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:18px 32px;text-align:center;background-color:#111318;border-top:1px solid #262b35;">
                            <p style="margin:0 0 4px;font-size:12px;color:#9aa2b0;">
                                {{ $pie }}
                            </p>
                            <p style="margin:0;font-size:11px;color:#6e7685;">
                                © {{ date('Y') }} {{ $marca }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
