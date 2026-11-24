import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BitacoraController from '@/actions/App/Http/Controllers/BitacoraController';

const MODULOS = [
    { id: 'todos', label: 'Todos los módulos' },
    { id: 'pagos', label: 'Pagos y Cobros' },
    { id: 'citas', label: 'Citas y Agenda' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'barberos', label: 'Barberos' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'autenticacion', label: 'Accesos / Login' },
];

const NIVELES = [
    { id: 'todos', label: 'Todos los niveles' },
    { id: 'exito', label: 'Éxito' },
    { id: 'info', label: 'Informativo' },
    { id: 'alerta', label: 'Alerta' },
    { id: 'error', label: 'Error / Rechazo' },
];

export default function BitacoraIndex({ eventos, resumen = {}, filtros = {} }) {
    const [modulo, setModulo] = useState(filtros.modulo || 'todos');
    const [nivel, setNivel] = useState(filtros.nivel || 'todos');
    const [fechaDesde, setFechaDesde] = useState(filtros.fecha_desde || '');
    const [fechaHasta, setFechaHasta] = useState(filtros.fecha_hasta || '');
    const [q, setQ] = useState(filtros.q || '');
    const [abiertoId, setAbiertoId] = useState(null);

    const aplicarFiltros = (e) => {
        if (e) e.preventDefault();
        const query = {};
        if (modulo && modulo !== 'todos') query.modulo = modulo;
        if (nivel && nivel !== 'todos') query.nivel = nivel;
        if (fechaDesde) query.fecha_desde = fechaDesde;
        if (fechaHasta) query.fecha_hasta = fechaHasta;
        if (q.trim()) query.q = q.trim();

        router.get(BitacoraController.index.url({ query }), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const limpiarFiltros = () => {
        setModulo('todos');
        setNivel('todos');
        setFechaDesde('');
        setFechaHasta('');
        setQ('');
        router.get(BitacoraController.index.url(), {}, { replace: true });
    };

    const lista = eventos?.data || [];

    return (
        <>
            <Head title="Bitácora de Auditoría" />

            <h1 className="nombre-pagina">Bitácora del Sistema</h1>
            <p className="descripcion-pagina">
                Registro histórico de solo lectura · Exclusivo para Administración
            </p>

            <div className="bitacora-readonly-banner">
                <strong>Modo Solo Lectura:</strong> Los registros de esta bitácora son inmutables y
                guardan cada estatus de pago, cita, cambio de configuración y acceso del sistema.
            </div>

            <div className="resumen-kpi-grid bitacora-kpis">
                <div className="kpi-card">
                    <span className="kpi-label">Total Eventos</span>
                    <strong className="kpi-valor">{resumen.total ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Eventos de Pagos</span>
                    <strong className="kpi-valor">{resumen.pagos ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Alertas / Errores</span>
                    <strong className="kpi-valor">{resumen.alertas_errores ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Registrados Hoy</span>
                    <strong className="kpi-valor">{resumen.hoy ?? 0}</strong>
                </div>
            </div>

            <form className="bitacora-filtros" onSubmit={aplicarFiltros}>
                <div className="bitacora-filtro-campo">
                    <label htmlFor="bit-modulo">Módulo</label>
                    <select
                        id="bit-modulo"
                        value={modulo}
                        onChange={(e) => setModulo(e.target.value)}
                    >
                        {MODULOS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bitacora-filtro-campo">
                    <label htmlFor="bit-nivel">Nivel</label>
                    <select
                        id="bit-nivel"
                        value={nivel}
                        onChange={(e) => setNivel(e.target.value)}
                    >
                        {NIVELES.map((n) => (
                            <option key={n.id} value={n.id}>
                                {n.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bitacora-filtro-campo">
                    <label htmlFor="bit-desde">Desde</label>
                    <input
                        id="bit-desde"
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>

                <div className="bitacora-filtro-campo">
                    <label htmlFor="bit-hasta">Hasta</label>
                    <input
                        id="bit-hasta"
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>

                <div className="bitacora-filtro-campo bitacora-filtro-buscar">
                    <label htmlFor="bit-q">Buscar</label>
                    <input
                        id="bit-q"
                        type="search"
                        placeholder="Usuario, folio, acción, IP..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <div className="bitacora-filtro-acciones">
                    <button type="submit" className="boton">
                        Filtrar
                    </button>
                    <button
                        type="button"
                        className="boton-secundario"
                        onClick={limpiarFiltros}
                    >
                        Limpiar
                    </button>
                </div>
            </form>

            {lista.length === 0 ? (
                <div className="estado-vacio">
                    <h2>No hay registros en la bitácora</h2>
                    <p>
                        Conforme se creen citas, se procesen pagos o los usuarios inicien sesión,
                        verás aquí cada evento en tiempo real.
                    </p>
                </div>
            ) : (
                <>
                    <ul className="bitacora-lista">
                        {lista.map((ev) => {
                            const abierto = abiertoId === ev.id;
                            return (
                                <li key={ev.id} className={`bitacora-card nivel-${ev.nivel}`}>
                                    <div className="bitacora-card-top">
                                        <div className="bitacora-badges">
                                            <span className={`bit-nivel-badge ${ev.nivel}`}>
                                                {ev.nivel.toUpperCase()}
                                            </span>
                                            <span className="bit-modulo-badge">{ev.modulo}</span>
                                            <code className="bit-accion-code">{ev.accion}</code>
                                        </div>
                                        <span className="bit-fecha">
                                            #{ev.id} · {ev.fecha_hora}
                                        </span>
                                    </div>

                                    <p className="bitacora-desc">{ev.descripcion}</p>

                                    <div className="bitacora-meta-row">
                                        <span>
                                            Actor: <strong>{ev.usuario_nombre}</strong> (
                                            {ev.usuario_rol})
                                        </span>
                                        {ev.entidad_tipo && (
                                            <span>
                                                Entidad:{' '}
                                                <strong>
                                                    {ev.entidad_tipo}
                                                    {ev.entidad_id ? ` #${ev.entidad_id}` : ''}
                                                </strong>
                                            </span>
                                        )}
                                        {ev.ip_address && (
                                            <span>
                                                IP: <code>{ev.ip_address}</code>
                                            </span>
                                        )}
                                    </div>

                                    {ev.detalles && (
                                        <div className="bitacora-detalles-wrap">
                                            <button
                                                type="button"
                                                className="bit-detalles-toggle"
                                                onClick={() =>
                                                    setAbiertoId(abierto ? null : ev.id)
                                                }
                                            >
                                                {abierto
                                                    ? 'Ocultar datos técnicos ▲'
                                                    : 'Ver datos técnicos ▼'}
                                            </button>

                                            {abierto && (
                                                <pre className="bit-detalles-json">
                                                    {JSON.stringify(ev.detalles, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {eventos?.links?.length > 3 && (
                        <nav className="bitacora-paginacion" aria-label="Paginación de bitácora">
                            {eventos.links.map((link, idx) =>
                                link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        preserveScroll
                                        className={`bit-page-link ${link.active ? 'activo' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={idx}
                                        className="bit-page-link deshabilitado"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            )}
                        </nav>
                    )}
                </>
            )}
        </>
    );
}
