import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import AccessibilityToggle from '@/Components/AccessibilityToggle';
import AppLoader from '@/Components/AppLoader';
import AppSidebar from '@/Components/AppSidebar';
import BottomTabBar from '@/Components/BottomTabBar';
import MobileTopBar from '@/Components/MobileTopBar';

function getContrastText(hex) {
    const clean = (hex || '#d4a259').replace('#', '');
    if (clean.length !== 6) return '#141210';
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#141210' : '#ffffff';
}

export default function MainLayout({ children }) {
    const { auth, tenant } = usePage().props;
    const autenticado = Boolean(auth?.user);
    const marca = tenant?.nombre || "Danny's BarberShop";
    const tagline = tenant?.tagline || 'Corte Clásico · Barba · Estilo Artesanal';
    const logoUrl = tenant?.logo_url || '/img/icono.png';
    const heroUrl = tenant?.hero_url || '/img/1.webp';
    const heroFallback = heroUrl === '/img/1.webp' ? '/img/1.jpg' : heroUrl;
    const accentHex = (tenant?.color_primario || '#d4a259').toLowerCase();
    const esTemaCustom = accentHex !== '#d4a259';
    const onAccent = getContrastText(accentHex);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--tenant-accent', accentHex);
        root.style.setProperty('--tenant-on-accent', onAccent);
        root.dataset.customTheme = esTemaCustom ? 'true' : 'false';

        // Sincronizar favicon y apple-touch-icon en vivo al cambiar logo o barbería
        document
            .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
            .forEach((link) => {
                link.setAttribute('href', logoUrl);
            });
    }, [accentHex, onAccent, esTemaCustom, logoUrl]);

    const accentStyle = {
        '--accent-gold': accentHex,
        '--tenant-accent': accentHex,
        '--tenant-on-accent': onAccent,
    };

    if (autenticado) {
        return (
            <div className="app-shell con-bottom-nav" style={accentStyle}>
                <AppSidebar />
                <div className="app-shell-main no-scrollbar">
                    <MobileTopBar />
                    <div className="mobile-hero-banner" aria-hidden="true">
                        <picture>
                            {heroUrl.endsWith('.webp') && <source srcSet={heroUrl} type="image/webp" />}
                            <img src={heroFallback} alt={marca} />
                        </picture>
                        <div className="mobile-hero-caption">
                            <div className="brand-header-row mobile">
                                <img src={logoUrl} alt={marca} className="brand-logo-badge sm" />
                                <div className="brand-text-col">
                                    <span>EST. BARBER SHOP</span>
                                    <strong>{marca}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <main className="app-shell-content">{children}</main>
                </div>
                <AccessibilityToggle />
                <BottomTabBar />
                <AppLoader />
            </div>
        );
    }

    return (
        <div className="contenedor-app" style={accentStyle}>
            <div className="imagen">
                <picture>
                    {heroUrl.endsWith('.webp') && <source srcSet={heroUrl} type="image/webp" />}
                    <img src={heroFallback} alt={marca} />
                </picture>
                <div className="marca-barberia">
                    <div className="brand-header-row">
                        <img src={logoUrl} alt={marca} className="brand-logo-badge lg" />
                        <div className="brand-text-col">
                            <span className="marca-etiqueta">EST. BARBER SHOP</span>
                            <strong className="marca-titulo">{marca}</strong>
                            <span className="marca-subtitulo">{tagline}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="app no-scrollbar">{children}</div>
            <AccessibilityToggle />
            <AppLoader />
        </div>
    );
}
