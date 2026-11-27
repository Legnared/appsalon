<?php

namespace App\Mail\Transports;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class ResendHttpTransport extends AbstractTransport
{
    private const ENDPOINT = 'https://api.resend.com/emails';

    public function __construct(
        private readonly string $apiKey,
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        if (trim($this->apiKey) === '') {
            Log::warning('ResendHttpTransport: RESEND_KEY no configurada; correo omitido y registrado en log.');

            return;
        }

        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $fromList = $email->getFrom();
        $fromAddress = count($fromList) > 0
            ? $this->formatAddress($fromList[0])
            : $this->formatAddress(new Address(
                (string) config('mail.from.address', 'onboarding@resend.dev'),
                (string) config('mail.from.name', config('app.name', 'BarberShop'))
            ));

        $payload = [
            'from' => $fromAddress,
            'to' => array_map(fn (Address $a) => $a->getAddress(), $email->getTo()),
            'subject' => (string) $email->getSubject(),
        ];

        if ($email->getHtmlBody()) {
            $payload['html'] = (string) $email->getHtmlBody();
        }
        if ($email->getTextBody()) {
            $payload['text'] = (string) $email->getTextBody();
        }
        if (count($email->getReplyTo()) > 0) {
            $payload['reply_to'] = $email->getReplyTo()[0]->getAddress();
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(15)
            ->acceptJson()
            ->post(self::ENDPOINT, $payload);

        if (! $response->successful()) {
            $errorBody = $response->json('message') ?? $response->body();
            throw new RuntimeException("Error de Resend API ({$response->status()}): {$errorBody}");
        }
    }

    private function formatAddress(Address $address): string
    {
        $name = trim($address->getName());

        return $name !== ''
            ? "{$name} <{$address->getAddress()}>"
            : $address->getAddress();
    }

    public function __toString(): string
    {
        return 'resend-http';
    }
}
