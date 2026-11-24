import { usePage } from '@inertiajs/react';
import { confirmarCerrarSesion } from '@/Components/AppSidebar';

export default function MobileTopBar() {
    const { auth } = usePage().props;
    const usuario = auth?.user;

    if (!usuario) return null;

    const esAdmin = Boolean(usuario.admin);
    const esBarbero = !esAdmin && usuario.rol === 'barbero';
    const rolLabel = esAdmin ? 'Admin' : esBarbero ? 'Barbero' : 'Cliente';
    const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();

    return (
        <header className="mobile-top-bar">
            <div className="mobile-top-left">
                <div className="mobile-avatar">
                    {usuario.foto_url ? (
                        <img src={usuario.foto_url} alt={usuario.nombreCompleto} />
                    ) : (
                        <span>{inicial}</span>
                    )}
                </div>
                <div className="mobile-user-info">
                    <span className="mobile-brand">App Salón · {rolLabel}</span>
                    <strong className="mobile-greeting">Hola, {usuario.nombre}</strong>
                </div>
            </div>

            <button
                type="button"
                className="mobile-logout-btn"
                onClick={confirmarCerrarSesion}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </header>
    );
}
