import { Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import AuthController from '@/actions/App/Http/Controllers/AuthController';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';
import CitaController from '@/actions/App/Http/Controllers/CitaController';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export async function confirmarCerrarSesion() {
    const result = await Swal.fire({
        icon: 'question',
        title: '¿Cerrar sesión?',
        text: 'Tendrás que volver a ingresar tus credenciales para entrar.',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b83232',
        cancelButtonColor: '#28221c',
        background: '#1f1b17',
        color: '#f5efe6',
    });

    if (result.isConfirmed) {
        router.post(AuthController.logout.url());
    }
}

export default function AppSidebar() {
    const { url, props } = usePage();
    const usuario = props?.auth?.user;

    if (!usuario) return null;

    const esAdmin = Boolean(usuario.admin);
    const esBarbero = !esAdmin && usuario.rol === 'barbero';

    const isPath = (prefix) => url.startsWith(prefix);
    const rolLabel = esAdmin ? 'Dueño / Admin' : esBarbero ? 'Barbero' : 'Cliente';
    const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();

    return (
        <aside className="app-sidebar" aria-label="Menú lateral">
            <div className="sidebar-full-bg" aria-hidden="true">
                <picture>
                    <source srcSet="/img/1.webp" type="image/webp" />
                    <img src="/img/1.jpg" alt="" />
                </picture>
            </div>

            <div className="sidebar-brand">
                <div className="sidebar-brand-content">
                    <span className="brand-tag">EST. BARBER SHOP</span>
                    <strong className="brand-title">App Salón</strong>
                    <span className="brand-role">{rolLabel}</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {esAdmin && (
                    <>
                        <Link
                            href={AdminController.index.url()}
                            className={`sidebar-link ${isPath('/admin') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Agenda de Citas</span>
                        </Link>

                        <Link
                            href={BarberoController.index.url()}
                            className={`sidebar-link ${isPath('/barberos') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>Equipo de Barberos</span>
                        </Link>

                        <Link
                            href={ClienteController.index.url()}
                            className={`sidebar-link ${isPath('/clientes') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>Clientes y Prospectos</span>
                        </Link>

                        <Link
                            href={ServicioController.index.url()}
                            className={`sidebar-link ${isPath('/servicios') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="6" cy="6" r="3" />
                                <circle cx="6" cy="18" r="3" />
                                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                                <line x1="8.12" y1="8.12" x2="12" y2="12" />
                            </svg>
                            <span>Catálogo de Servicios</span>
                        </Link>
                    </>
                )}

                {esBarbero && (
                    <Link
                        href={AdminController.index.url()}
                        className={`sidebar-link ${isPath('/admin') ? 'activo' : ''}`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Mi Agenda del Día</span>
                    </Link>
                )}

                {!esAdmin && !esBarbero && (
                    <Link
                        href={CitaController.index.url()}
                        className={`sidebar-link ${isPath('/cita') ? 'activo' : ''}`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Reservar Cita</span>
                    </Link>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {usuario.foto_url ? (
                            <img src={usuario.foto_url} alt={usuario.nombreCompleto} />
                        ) : (
                            <span>{inicial}</span>
                        )}
                    </div>
                    <div className="sidebar-user-meta">
                        <strong>{usuario.nombreCompleto}</strong>
                        <span>{usuario.email}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="sidebar-logout-btn"
                    onClick={confirmarCerrarSesion}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
