import { Link, usePage } from '@inertiajs/react';
import { confirmarCerrarSesion } from '@/Components/AppSidebar';
import BitacoraController from '@/actions/App/Http/Controllers/BitacoraController';
import PerfilController from '@/actions/App/Http/Controllers/PerfilController';
import SuperAdminTenantController from '@/actions/App/Http/Controllers/SuperAdminTenantController';

export default function MobileTopBar() {
    const { auth, tenant } = usePage().props;
    const usuario = auth?.user;
    const marca = tenant?.nombre || "Danny's BarberShop";

    if (!usuario) return null;

    const esAdmin = Boolean(usuario.admin);
    const puedeVerBitacora = Boolean(usuario.puede_ver_bitacora);
    const esBarbero = !esAdmin && usuario.rol === 'barbero';
    const rolLabel = esAdmin ? 'Admin' : esBarbero ? 'Barbero' : 'Cliente';
    const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();

    return (
        <header className="mobile-top-bar">
            <Link
                href={PerfilController.index.url()}
                className="mobile-top-left mobile-profile-trigger"
                title="Mi Perfil y Contraseña"
            >
                <div className="mobile-avatar">
                    {usuario.foto_url ? (
                        <img src={usuario.foto_url} alt={usuario.nombreCompleto} />
                    ) : (
                        <span>{inicial}</span>
                    )}
                </div>
                <div className="mobile-user-info">
                    <span className="mobile-brand">{marca} · {rolLabel}</span>
                    <strong className="mobile-greeting">
                        Hola, {usuario.nombre} <span className="mobile-profile-tag">Perfil ✎</span>
                    </strong>
                </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {puedeVerBitacora && (
                    <Link
                        href={SuperAdminTenantController.index.url()}
                        className="mobile-logout-btn"
                        title="Super-Admin SaaS"
                        aria-label="Super-Admin SaaS"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </Link>
                )}

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
