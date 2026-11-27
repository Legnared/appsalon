import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import PaginadorLista from '@/Components/PaginadorLista';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';

const BARBEROS_POR_PAGINA = 6;

export default function BarberosIndex({ barberos = [] }) {
    const [pagina, setPagina] = useState(1);
    const activos = barberos.filter((b) => b.activo !== false).length;

    const barberosPaginados = useMemo(() => {
        const inicio = (pagina - 1) * BARBEROS_POR_PAGINA;
        return barberos.slice(inicio, inicio + BARBEROS_POR_PAGINA);
    }, [barberos, pagina]);

    const handleToggleActivo = (barbero) => {
        router.post(
            BarberoController.toggleActivo.url(),
            { id: barbero.id },
            {
                only: ['barberos'],
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    return (
        <>
            <Head title="Barberos" />

            <h1 className="nombre-pagina">Equipo de Barberos</h1>
            <p className="descripcion-pagina">
                Administra a tus barberos, sus especialidades y disponibilidad
            </p>

            <Barra />
            <Alertas />

            <div className="resumen-kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Barberos activos</span>
                    <strong className="kpi-valor">
                        {activos} / {barberos.length}
                    </strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Nuevo integrante</span>
                    <Link
                        href={BarberoController.showCrear.url()}
                        className="boton"
                        style={{ margin: '0.6rem 0 0', minHeight: '4rem', padding: '0.8rem 1.4rem', fontSize: '1.4rem' }}
                    >
                        + Registrar Barbero
                    </Link>
                </div>
            </div>

            {barberos.length === 0 ? (
                <div className="estado-vacio">
                    <h2>Aún no hay barberos registrados</h2>
                    <p>Pulsa &ldquo;+ Registrar Barbero&rdquo; para dar de alta al primer integrante de tu equipo.</p>
                </div>
            ) : (
                <>
                    <ul className="servicios">
                        {barberosPaginados.map((barbero) => {
                            const estaActivo = barbero.activo !== false;
                            return (
                                <li
                                    key={barbero.id}
                                    className={!estaActivo ? 'servicio-inactivo' : ''}
                                >
                                    <div className="servicio-card-body">
                                        <div className="servicio-thumb">
                                            {barbero.foto_url ? (
                                                <img
                                                    src={barbero.foto_url}
                                                    alt={barbero.nombre_completo}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="servicio-thumb-placeholder" aria-hidden="true">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="servicio-info">
                                            <div className="servicio-card-top">
                                                <p className="servicio-card-nombre">
                                                    {barbero.nombre_completo}
                                                </p>
                                                <span
                                                    className={`meta-pill ${estaActivo ? 'pill-activo' : 'pill-oculto'}`}
                                                >
                                                    {estaActivo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>

                                            <div className="servicio-meta-badges">
                                                {barbero.especialidad && (
                                                    <span className="meta-pill">
                                                        {barbero.especialidad}
                                                    </span>
                                                )}
                                                <span className="meta-pill">
                                                    {barbero.clientes_asignados_count ?? 0} clientes
                                                </span>
                                                <span className="meta-pill">
                                                    {barbero.citas_como_barbero_count ?? 0} citas
                                                </span>
                                            </div>

                                            <p className="servicio-card-desc">
                                                {barbero.email}
                                                {barbero.telefono ? ` · Tel: ${barbero.telefono}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="acciones" style={{ marginTop: '1.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Link
                                            className="boton"
                                            href={BarberoController.showActualizar.url({
                                                query: { id: barbero.id },
                                            })}
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            className="boton-secundario"
                                            onClick={() => handleToggleActivo(barbero)}
                                        >
                                            {estaActivo ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    <PaginadorLista
                        total={barberos.length}
                        paginaActual={pagina}
                        porPagina={BARBEROS_POR_PAGINA}
                        onCambiarPagina={setPagina}
                        etiqueta="barberos"
                    />
                </>
            )}
        </>
    );
}
