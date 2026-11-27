<?php

namespace App\Providers;

use App\Mail\Transports\ResendHttpTransport;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantContext::class, fn () => new TenantContext());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (
            $this->app->environment('production') ||
            str_starts_with((string) config('app.url', ''), 'https://')
        ) {
            URL::forceScheme('https');
        }

        Mail::extend('resend', function (array $config = []) {
            $key = (string) ($config['key'] ?? config('services.resend.key', ''));

            return new ResendHttpTransport($key);
        });
    }
}
