<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#141210">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    @php
        $tenantNombre = isset($currentTenant) && $currentTenant ? $currentTenant->nombre : config('app.name', "Danny's BarberShop");
        $tenantLogo = isset($currentTenant) && $currentTenant ? $currentTenant->logo_url : '/img/icono.png';
        $tenantColor = strtolower((string) (isset($currentTenant) && $currentTenant ? ($currentTenant->color_primario ?: '#d4a259') : '#d4a259'));
        $tenantTema = isset($currentTenant) && $currentTenant ? $currentTenant->temaDiseno() : 'rustico_editorial';
        $esTemaCustom = $tenantColor !== '#d4a259';
    @endphp
    <title inertia>{{ $tenantNombre }}</title>
    <style>
        :root {
            --tenant-accent: {{ $tenantColor }};
        }
    </style>
    <script>
        document.documentElement.dataset.customTheme = '{{ $esTemaCustom ? 'true' : 'false' }}';
        document.documentElement.dataset.designTemplate = '{{ $tenantTema }}';
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Poppins:wght@300;400;600;700;900&display=swap" rel="stylesheet">
    <link rel="icon" href="{{ $tenantLogo }}" type="image/png">
    <link rel="apple-touch-icon" href="{{ $tenantLogo }}">
    @viteReactRefresh
    @vite(['resources/scss/app.scss', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
