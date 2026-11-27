import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import AuthController from '@/actions/App/Http/Controllers/AuthController';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';
import BitacoraController from '@/actions/App/Http/Controllers/BitacoraController';
import CitaController from '@/actions/App/Http/Controllers/CitaController';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';
import HorarioController from '@/actions/App/Http/Controllers/HorarioController';
import MarcaController from '@/actions/App/Http/Controllers/MarcaController';
import PerfilController from '@/actions/App/Http/Controllers/PerfilController';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';
import SuperAdminCuentaController from '@/actions/App/Http/Controllers/SuperAdminCuentaController';
import SuperAdminTenantController from '@/actions/App/Http/Controllers/SuperAdminTenantController';
import useFeature from '@/hooks/useFeature';

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
    const [sistemaAbierto, setSistemaAbierto] = useState(true);
    const usuario = props?.auth?.user;
    const tenant = props?.tenant;
    const marca = tenant?.nombre || "Danny's BarberShop";
    const logoUrl = tenant?.logo_url || '/img/icono.png';
    const heroUrl = tenant?.hero_url || '/img/1.webp';
    const misReservaciones = props?.misReservaciones ?? [];

    if (!usuario) return null;

    const esAdmin = Boolean(usuario.admin);
    const puedeVerBitacora = Boolean(usuario.puede_ver_bitacora);
    const esBarbero = !esAdmin && usuario.rol === 'barbero';
    const esCliente = !esAdmin && !esBarbero;
    const tieneMultiBarbero = useFeature('multi_barbero', true);
    const tieneCrmClientes = useFeature('crm_clientes', true);

    const isPath = (prefix) => url.startsWith(prefix);
    const rolLabel = esAdmin ? 'Dueño / Admin' : esBarbero ? 'Barbero' : 'Cliente';
    const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase();

    return (
        <aside className="app-sidebar" aria-label="Menú lateral">
            <div className="sidebar-full-bg" aria-hidden="true">
                <picture>
                    {heroUrl.endsWith('.webp') && <source srcSet={heroUrl} type="image/webp" />}
                    <img src={heroUrl === '/img/1.webp' ? '/img/1.jpg' : heroUrl} alt="" />
                </picture>
            </div>

            <div className="sidebar-brand">
                <div className="sidebar-brand-content">
                    <div className="brand-header-row">
                        <img src={logoUrl} alt={marca} className="brand-logo-badge" />
                        <div className="brand-text-col">
                            <span className="brand-tag">EST. BARBER SHOP</span>
                            <strong className="brand-title">{marca}</strong>
                            <span className="brand-role">{rolLabel}</span>
                        </div>
                    </div>
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

                        {tieneMultiBarbero && (
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
                        )}

                        {tieneCrmClientes && (
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
                        )}

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

                        <Link
                            href={HorarioController.index.url()}
                            className={`sidebar-link ${isPath('/horarios') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>Horarios Laborales</span>
                        </Link>

                        <Link
                            href={MarcaController.index.url()}
                            className={`sidebar-link ${isPath('/mi-marca') ? 'activo' : ''}`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Mi Marca y Logo</span>
                        </Link>

                        {puedeVerBitacora && (
                            <div className="sidebar-group">
                                <button
                                    type="button"
                                    className="sidebar-group-toggle"
                                    onClick={() => setSistemaAbierto((v) => !v)}
                                    aria-expanded={sistemaAbierto}
                                >
                                    <span>Sistema &amp; SaaS</span>
                                    <span>{sistemaAbierto ? '▾' : '▸'}</span>
                                </button>

                                {sistemaAbierto && (
                                    <ul className="sidebar-group-list">
                                        <li>
                                            <Link
                                                href={SuperAdminTenantController.index.url()}
                                                className={`sidebar-link ${url === '/super-admin' || isPath('/super-admin/barberias') ? 'activo' : ''}`}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                    <polyline points="9 22 9 12 15 12 15 22" />
                                                </svg>
                                                <span>Barberías SaaS</span>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link
                                                href={SuperAdminCuentaController.index.url()}
                                                className={`sidebar-link ${isPath('/super-admin/cuenta-roles') ? 'activo' : ''}`}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                </svg>
                                                <span>Mi Cuenta y Roles</span>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link
                                                href={BitacoraController.index.url()}
                                                className={`sidebar-link ${isPath('/bitacora') ? 'activo' : ''}`}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                                <span>Bitácora (Solo Lectura)</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
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

                {esCliente && (
                    <>
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

                        <div className="sidebar-reservaciones">
                            <div className="sidebar-res-header">
                                <span>Mis Próximas Citas</span>
                                <strong className="res-count">{misReservaciones.length}</strong>
                            </div>

                            {misReservaciones.length === 0 ? (
                                <p className="sidebar-res-empty">
                                    Aún no tienes citas próximas. Reserva para ti o para tu hijo.
                                </p>
                            ) : (
                                <ul className="sidebar-res-list">
                                    {misReservaciones.map((res) => (
                                        <li key={res.id} className="sidebar-res-card">
                                            <div className="res-top">
                                                <span className="res-fecha">
                                                    {res.fecha} · {res.hora}
                                                </span>
                                                <span
                                                    className={`res-pago-dot ${res.pago_estado === 'pagado' ? 'pagado' : 'pendiente'}`}
                                                >
                                                    {res.pago_estado === 'pagado' ? 'Pagado' : 'POS'}
                                                </span>
                                            </div>
                                            <strong className="res-para">
                                                {res.para_quien === 'titular'
                                                    ? 'Para mí'
                                                    : `${res.para_quien === 'hijo' ? 'Hijo' : 'Familiar'}: ${res.nombre_beneficiario || 'Sin nombre'}`}
                                            </strong>
                                            {res.barbero && (
                                                <span className="res-meta">Barbero: {res.barbero}</span>
                                            )}
                                            <span className="res-meta">
                                                Total: ${Number(res.total || 0).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <Link
                    href={PerfilController.index.url()}
                    className={`sidebar-user sidebar-user-link ${isPath('/mi-perfil') ? 'activo' : ''}`}
                    title="Abrir Mi Perfil y Contraseña"
                >
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
                        <em className="sidebar-profile-pill">Mi Perfil ✎</em>
                    </div>
                </Link>

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
