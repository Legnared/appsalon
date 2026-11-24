import { Link, usePage } from '@inertiajs/react';
import { confirmarCerrarSesion } from '@/Components/AppSidebar';
import BitacoraController from '@/actions/App/Http/Controllers/BitacoraController';

export default function MobileTopBar() {
    const { auth } = usePage().props;
    const usuario = auth?.user;

    if (!usuario) return null;

    const esAdmin = Boolean(usuario.admin);
    const puedeVerBitacora = Boolean(usuario.puede_ver_bitacora);
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {puedeVerBitacora && (
                    <Link
                        href={BitacoraController.index.url()}
                        className="mobile-logout-btn"
                        title="Bitácora de Auditoría"
                        aria-label="Bitácora de Auditoría"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </Link>
                )}

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
            </div>
        </header>
    );
}
