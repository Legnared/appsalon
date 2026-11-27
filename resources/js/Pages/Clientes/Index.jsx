import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import PaginadorLista from '@/Components/PaginadorLista';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';

const CLIENTES_POR_PAGINA = 8;

export default function ClientesIndex({
    clientes = [],
    barberos = [],
    barberoFiltro = 'todos',
}) {
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, barberoFiltro]);

    const clientesFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return clientes;
        return clientes.filter((c) => {
            return (
                (c.nombre_completo || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.telefono || '').toLowerCase().includes(q) ||
                (c.barbero_nombre || '').toLowerCase().includes(q)
            );
        });
    }, [clientes, busqueda]);

    const clientesPaginados = useMemo(() => {
        const inicio = (pagina - 1) * CLIENTES_POR_PAGINA;
        return clientesFiltrados.slice(inicio, inicio + CLIENTES_POR_PAGINA);
    }, [clientesFiltrados, pagina]);

    const filtrarPorBarbero = (nuevoFiltro) => {
        if (String(nuevoFiltro) === String(barberoFiltro)) return;
        router.get(
            ClienteController.index.url({ query: { barbero_id: nuevoFiltro } }),
            {},
            {
                only: ['clientes', 'barberoFiltro'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setCargando(true),
                onFinish: () => setCargando(false),
            }
        );
    };

    return (
        <>
            <Head title="Clientes" />

            <h1 className="nombre-pagina">Cartera de Clientes</h1>
            <p className="descripcion-pagina">
                Visualiza clientes y prospectos asignados a cada barbero
            </p>

            <Barra />
            <Alertas />

            <section className="agenda-control">
                <div className="agenda-control-header">
                    <div>
                        <span className="agenda-etiqueta">Filtro por Barbero</span>
                        <h2 className="agenda-fecha-titulo">
                            {clientesFiltrados.length} cliente{clientesFiltrados.length === 1 ? '' : 's'}
                        </h2>
                    </div>
                    <Link
                        href={ClienteController.showCrear.url()}
                        className="boton"
                        style={{ margin: 0, minHeight: '4.2rem', padding: '0.9rem 1.8rem', fontSize: '1.45rem' }}
                    >
                        + Nuevo Cliente / Prospecto
                    </Link>
                </div>

                <div className="agenda-filtros-grid">
                    <div className="agenda-campo">
                        <label htmlFor="filtro-barbero">Barbero de cabecera</label>
                        <select
                            id="filtro-barbero"
                            value={barberoFiltro}
                            onChange={(e) => filtrarPorBarbero(e.target.value)}
                        >
                            <option value="todos">Todos los barberos</option>
                            <option value="sin_asignar">Sin barbero asignado</option>
                            {barberos.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.nombre_completo || `${b.nombre} ${b.apellido}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="agenda-campo">
                        <label htmlFor="buscar-cliente">Buscar cliente</label>
                        <input
                            type="search"
                            id="buscar-cliente"
                            placeholder="Nombre, teléfono o correo..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <div className={`agenda-resultados ${cargando ? 'cargando' : ''}`}>
                {clientesFiltrados.length === 0 ? (
                    <div className="estado-vacio">
                        <h2>No hay clientes en este filtro</h2>
                        <p>Registra un nuevo cliente/prospecto o cambia el barbero seleccionado.</p>
                    </div>
                ) : (
                    <>
                        <ul className="servicios">
                            {clientesPaginados.map((cliente) => (
                                <li key={cliente.id}>
                                    <div className="servicio-card-top">
                                        <p className="servicio-card-nombre">
                                            {cliente.nombre_completo}
                                        </p>
                                        <span
                                            className={`meta-pill ${cliente.confirmado ? 'pill-activo' : 'pill-oculto'}`}
                                        >
                                            {cliente.confirmado ? 'Confirmado' : 'Pendiente'}
                                        </span>
                                    </div>

                                    <div className="servicio-meta-badges">
                                        <span className="meta-pill">
                                            Barbero: {cliente.barbero_nombre || 'Sin asignar'}
                                        </span>
                                        <span className="meta-pill">
                                            {cliente.citas_count} cita{cliente.citas_count === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    <p className="servicio-card-desc">
                                        {cliente.email}
                                        {cliente.telefono ? ` · Tel: ${cliente.telefono}` : ''}
                                    </p>

                                    <div className="acciones" style={{ marginTop: '1.4rem', display: 'flex' }}>
                                        <Link
                                            className="boton"
                                            href={ClienteController.showActualizar.url({
                                                query: { id: cliente.id },
                                            })}
                                        >
                                            Editar / Reasignar Barbero
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <PaginadorLista
                            total={clientesFiltrados.length}
                            paginaActual={pagina}
                            porPagina={CLIENTES_POR_PAGINA}
                            onCambiarPagina={setPagina}
                            etiqueta="clientes"
                        />
                    </>
                )}
            </div>
        </>
    );
}
