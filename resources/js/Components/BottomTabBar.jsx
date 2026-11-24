import { Link, usePage } from '@inertiajs/react';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';
import CitaController from '@/actions/App/Http/Controllers/CitaController';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function BottomTabBar() {
    const { url, props } = usePage();
    const usuario = props?.auth?.user;

    if (!usuario) {
        return null;
    }

    const esAdmin = Boolean(usuario.admin);
    const esBarbero = !esAdmin && usuario.rol === 'barbero';
    const isPath = (prefix) => url.startsWith(prefix);

    if (esAdmin) {
        return (
            <nav className="bottom-tab-bar pb-safe" aria-label="Navegación principal móvil">
                <Link
                    href={AdminController.index.url()}
                    className={`bottom-tab-item ${isPath('/admin') ? 'activo' : ''}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Citas</span>
                </Link>

                <Link
                    href={BarberoController.index.url()}
                    className={`bottom-tab-item ${isPath('/barberos') ? 'activo' : ''}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Barberos</span>
                </Link>

                <Link
                    href={ServicioController.showCrear.url()}
                    className={`bottom-tab-item bottom-tab-fab ${isPath('/servicios/crear') ? 'activo' : ''}`}
                >
                    <span className="fab-circle">+</span>
                    <span>Nuevo</span>
                </Link>

                <Link
                    href={ClienteController.index.url()}
                    className={`bottom-tab-item ${isPath('/clientes') ? 'activo' : ''}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Clientes</span>
                </Link>

                <Link
                    href={ServicioController.index.url()}
                    className={`bottom-tab-item ${url === '/servicios' || isPath('/servicios/actualizar') ? 'activo' : ''}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                    </svg>
                    <span>Servicios</span>
                </Link>
            </nav>
        );
    }

    if (esBarbero) {
        return (
            <nav className="bottom-tab-bar pb-safe" aria-label="Navegación barbero móvil">
                <Link
                    href={AdminController.index.url()}
                    className={`bottom-tab-item ${isPath('/admin') ? 'activo' : ''}`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Mi Agenda</span>
                </Link>
            </nav>
        );
    }

    return (
        <nav className="bottom-tab-bar pb-safe" aria-label="Navegación cliente móvil">
            <Link
                href={CitaController.index.url()}
                className={`bottom-tab-item ${isPath('/cita') ? 'activo' : ''}`}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Reservar Cita</span>
            </Link>
        </nav>
    );
}
