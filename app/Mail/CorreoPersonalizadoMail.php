<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CorreoPersonalizadoMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $marca;
    public string $tagline;
    public string $colorPrimario;
    public string $logoUrl;
    public string $enlaceCta;
    public string $encabezado;
    public string $asuntoFinal;
    public string $saludo;
    public string $cuerpo;
    public string $botonTexto;
    public string $pie;

    public function __construct(?Tenant $tenant = null, ?array $override = null)
    {
        $this->marca = $tenant?->nombre ?: (string) config('app.name', "Danny's BarberShop");
        $this->tagline = $tenant?->tagline ?: 'Corte Clásico · Barba · Estilo Artesanal';
        $this->colorPrimario = $tenant?->color_primario ?: '#d4a259';
        $this->enlaceCta = $tenant ? $tenant->publicUrl() : (string) config('app.url', 'https://dannys.angeldevsign.com');

        $rawLogo = $tenant?->logo_url ?: '/img/icono.png';
        $this->logoUrl = str_starts_with($rawLogo, 'http')
            ? $rawLogo
            : rtrim($this->enlaceCta, '/') . '/' . ltrim($rawLogo, '/');

        $saved = is_array($tenant?->configuracion_extra['email_template'] ?? null)
            ? $tenant->configuracion_extra['email_template']
            : [];
        $tpl = array_merge(self::defaults($this->marca), $saved, $override ?? []);

        $reemplazos = [
            '{barberia}' => $this->marca,
            '{url}' => $this->enlaceCta,
        ];

        $this->encabezado = strtr((string) $tpl['encabezado'], $reemplazos);
        $this->asuntoFinal = strtr((string) $tpl['asunto'], $reemplazos);
        $this->saludo = strtr((string) $tpl['saludo'], $reemplazos);
        $this->cuerpo = strtr((string) $tpl['cuerpo'], $reemplazos);
        $this->botonTexto = strtr((string) $tpl['boton_texto'], $reemplazos);
        $this->pie = strtr((string) $tpl['pie'], $reemplazos);
    }

    public static function defaults(string $marca = '{barberia}'): array
    {
        return [
            'encabezado' => 'EST. BARBER SHOP · COMUNICADO OFICIAL',
            'asunto' => "Bienvenido a {$marca} · Agenda tu cita en línea",
            'saludo' => "¡Hola! Qué gusto saludarte desde {$marca}",
            'cuerpo' => "Ya puedes agendar tu próximo corte o servicio de barba en segundos, elegir a tu barbero favorito y confirmar tu horario sin llamadas ni esperas.",
            'boton_texto' => 'Agendar mi Cita Ahora',
            'pie' => "{$marca} · Todos los derechos reservados · Tecnología por Angel DevSign.",
        ];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                (string) config('mail.from.address', 'citas@angeldevsign.com'),
                $this->marca,
            ),
            subject: $this->asuntoFinal,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.personalizado',
        );
    }
}
