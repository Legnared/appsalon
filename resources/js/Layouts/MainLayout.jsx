import { usePage } from '@inertiajs/react';
import AccessibilityToggle from '@/Components/AccessibilityToggle';
import AppLoader from '@/Components/AppLoader';
import AppSidebar from '@/Components/AppSidebar';
import BottomTabBar from '@/Components/BottomTabBar';
import MobileTopBar from '@/Components/MobileTopBar';

export default function MainLayout({ children }) {
    const { auth } = usePage().props;
    const autenticado = Boolean(auth?.user);

    if (autenticado) {
        return (
            <div className="app-shell con-bottom-nav">
                <AppSidebar />
                <div className="app-shell-main no-scrollbar">
                    <MobileTopBar />
                    <div className="mobile-hero-banner" aria-hidden="true">
                        <picture>
                            <source srcSet="/img/1.webp" type="image/webp" />
                            <img src="/img/1.jpg" alt="App Salón Barbería" />
                        </picture>
                        <div className="mobile-hero-caption">
                            <span>EST. BARBER SHOP</span>
                            <strong>App Salón</strong>
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
        <div className="contenedor-app">
            <div className="imagen">
                <picture>
                    <source srcSet="/img/1.webp" type="image/webp" />
                    <img src="/img/1.jpg" alt="App Salón Barbería" />
                </picture>
                <div className="marca-barberia">
                    <span className="marca-etiqueta">EST. BARBER SHOP</span>
                    <strong className="marca-titulo">App Salón</strong>
                    <span className="marca-subtitulo">Corte Clásico · Barba · Estilo Artesanal</span>
                </div>
            </div>
            <div className="app no-scrollbar">{children}</div>
            <AccessibilityToggle />
            <AppLoader />
        </div>
    );
}
