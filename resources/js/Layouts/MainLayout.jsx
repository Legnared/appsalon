import { usePage } from '@inertiajs/react';
import AccessibilityToggle from '@/Components/AccessibilityToggle';
import BottomTabBar from '@/Components/BottomTabBar';

export default function MainLayout({ children }) {
    const { auth } = usePage().props;
    const autenticado = Boolean(auth?.user);

    return (
        <div className={`contenedor-app ${autenticado ? 'con-bottom-nav' : ''}`}>
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
            <BottomTabBar />
        </div>
    );
}
