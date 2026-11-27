import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import PaginadorLista from '@/Components/PaginadorLista';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

const SERVICIOS_POR_PAGINA = 6;

export default function ServiciosIndex({ servicios = [] }) {
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [pagina, setPagina] = useState(1);

    const totalServicios = useMemo(
        () => servicios.filter((s) => (s.tipo || 'servicio') !== 'producto'),
        [servicios]
    );
    const totalProductos = useMemo(
        () => servicios.filter((s) => s.tipo === 'producto'),
        [servicios]
    );

    const catalogoFiltrado = useMemo(() => {
        if (filtroTipo === 'servicio') return totalServicios;
        if (filtroTipo === 'producto') return totalProductos;
        return servicios;
    }, [filtroTipo, servicios, totalServicios, totalProductos]);

    const catalogoPaginado = useMemo(() => {
        const inicio = (pagina - 1) * SERVICIOS_POR_PAGINA;
        return catalogoFiltrado.slice(inicio, inicio + SERVICIOS_POR_PAGINA);
    }, [catalogoFiltrado, pagina]);

    const handleToggleActivo = (servicio) => {
        router.post(
            ServicioController.toggleActivo.url(),
            { id: servicio.id },
            {
                only: ['servicios'],
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleEliminar = async (servicio) => {
        const esProd = servicio.tipo === 'producto';
        const result = await Swal.fire({
            icon: 'warning',
            title: esProd ? '¿Eliminar producto?' : '¿Eliminar servicio?',
            text: `Se eliminará "${servicio.nombre}". Si solo deseas dejar de ofrecerlo temporalmente, puedes usar "Ocultar".`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#b83232',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        });

        if (result.isConfirmed) {
            router.post(
                ServicioController.eliminar.url(),
                { id: servicio.id },
                { preserveScroll: true }
            );
        }
    };

    return (
        <>
            <Head title="Servicios y Productos" />

            <h1 className="nombre-pagina">Servicios y Productos</h1>
            <p className="descripcion-pagina">
                Catálogo artesanal de cortes, barba, tratamientos y productos de cuidado masculino
            </p>

            <Barra />
            <Alertas />

            <div className="resumen-kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Servicios / Productos activos</span>
                    <strong className="kpi-valor">
                        {totalServicios.filter((s) => s.activo !== false).length} serv ·{' '}
                        {totalProductos.filter((s) => s.activo !== false).length} prod
                    </strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Agregar al catálogo</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '0.6rem' }}>
                        <Link
                            href={ServicioController.showCrear.url()}
                            className="boton"
                            style={{ margin: 0, minHeight: '3.8rem', padding: '0.7rem 1.2rem', fontSize: '1.35rem' }}
                        >
                            + Nuevo Servicio
                        </Link>
                        <Link
                            href={ServicioController.showCrear.url({ query: { tipo: 'producto' } })}
                            className="boton-secundario"
                            style={{ margin: 0, minHeight: '3.8rem', padding: '0.7rem 1.2rem', fontSize: '1.35rem' }}
                        >
                            + Nuevo Producto
                        </Link>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.8rem',
                    marginBottom: '1.8rem',
                }}
            >
                {[
                    { id: 'todos', label: `Todos (${servicios.length})` },
                    { id: 'servicio', label: `Servicios (${totalServicios.length})` },
                    { id: 'producto', label: `Productos (${totalProductos.length})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            setFiltroTipo(tab.id);
                            setPagina(1);
                        }}
                        className={`btn-agenda ${filtroTipo === tab.id ? 'activo' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <ul className="servicios">
                {catalogoPaginado.map((servicio) => {
                    const estaActivo = servicio.activo !== false;
                    const esProd = servicio.tipo === 'producto';
                    return (
                        <li
                            key={servicio.id}
                            className={!estaActivo ? 'servicio-inactivo' : ''}
                        >
                            <div className="servicio-card-body">
                                <div className="servicio-thumb">
                                    {servicio.imagen_url ? (
                                        <img
                                            src={servicio.imagen_url}
                                            alt={servicio.nombre}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="servicio-thumb-placeholder" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="6" cy="6" r="3" />
                                                <circle cx="6" cy="18" r="3" />
                                                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                                                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                                                <line x1="8.12" y1="8.12" x2="12" y2="12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="servicio-info">
                                    <div className="servicio-card-top">
                                        <p className="servicio-card-nombre">{servicio.nombre}</p>
                                        <p className="servicio-card-precio">${servicio.precio}</p>
                                    </div>

                                    <div className="servicio-meta-badges">
                                        {esProd ? (
                                            <>
                                                <span
                                                    className="meta-pill"
                                                    style={{
                                                        background: 'rgba(212, 162, 89, 0.2)',
                                                        color: '#f0c674',
                                                        border: '1px solid rgba(212, 162, 89, 0.4)',
                                                    }}
                                                >
                                                    Producto
                                                </span>
                                                {servicio.stock !== null && servicio.stock !== undefined && (
                                                    <span
                                                        className={`meta-pill ${Number(servicio.stock) > 0 ? 'pill-activo' : 'pill-oculto'}`}
                                                    >
                                                        {Number(servicio.stock) > 0
                                                            ? `Stock: ${servicio.stock}`
                                                            : 'Agotado'}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="meta-pill">
                                                {servicio.duracion_minutos || 30} min
                                            </span>
                                        )}
                                        <span
                                            className={`meta-pill ${estaActivo ? 'pill-activo' : 'pill-oculto'}`}
                                        >
                                            {estaActivo ? 'Visible' : 'Oculto'}
                                        </span>
                                    </div>

                                    {servicio.descripcion ? (
                                        <p className="servicio-card-desc">
                                            {servicio.descripcion}
                                        </p>
                                    ) : (
                                        <p className="servicio-card-desc sin-desc">
                                            Sin descripción aún — pulsa Editar para añadir detalles y foto.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="acciones acciones-servicio">
                                <Link
                                    className="boton"
                                    href={ServicioController.showActualizar.url({
                                        query: { id: servicio.id },
                                    })}
                                >
                                    Editar
                                </Link>

                                <button
                                    type="button"
                                    className="boton-secundario"
                                    onClick={() => handleToggleActivo(servicio)}
                                >
                                    {estaActivo ? 'Ocultar' : 'Activar'}
                                </button>

                                <button
                                    type="button"
                                    className="boton-eliminar"
                                    onClick={() => handleEliminar(servicio)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <PaginadorLista
                total={catalogoFiltrado.length}
                paginaActual={pagina}
                porPagina={SERVICIOS_POR_PAGINA}
                onCambiarPagina={setPagina}
                etiqueta={filtroTipo === 'producto' ? 'productos' : filtroTipo === 'servicio' ? 'servicios' : 'artículos'}
            />
        </>
    );
}
