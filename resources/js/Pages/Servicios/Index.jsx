import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosIndex({ servicios = [] }) {
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
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar servicio?',
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
            <Head title="Servicios" />

            <h1 className="nombre-pagina">Servicios</h1>
            <p className="descripcion-pagina">
                Catálogo artesanal de cortes, barba y tratamientos
            </p>

            <Barra />
            <Alertas />

            <ul className="servicios">
                {servicios.map((servicio) => {
                    const estaActivo = servicio.activo !== false;
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
                                        <span className="meta-pill">
                                            {servicio.duracion_minutos || 30} min
                                        </span>
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
        </>
    );
}
