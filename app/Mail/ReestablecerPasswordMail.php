<?php

namespace App\Mail;

use App\Services\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReestablecerPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $marca;

    public function __construct(
        public string $nombre,
        public string $token,
        ?string $marca = null,
    ) {
        $this->marca = $marca ?: app(TenantContext::class)->brandName();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                (string) config('mail.from.address', 'onboarding@resend.dev'),
                $this->marca,
            ),
            subject: "Reestablece tu contraseña - {$this->marca}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.reestablecer-password',
        );
    }
}
