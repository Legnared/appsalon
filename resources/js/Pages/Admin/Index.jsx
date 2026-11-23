import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Barra from '@/Components/Barra';
import BarberDatePicker from '@/Components/BarberDatePicker';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import APIController from '@/actions/App/Http/Controllers/APIController';
import PagoController from '@/actions/App/Http/Controllers/PagoController';

function sumarDias(fechaStr, dias) {
    const [y, m, d] = fechaStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + dias, 12, 0, 0));
    return dt.toISOString().split('T')[0];
}

function formatearFechaLarga(fechaStr) {
    if (!fechaStr) return '';
    const [y, m, d] = fechaStr.split('-').map(Number);
    if (!y || !m || !d) return fechaStr;
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const texto = dt.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function AdminIndex({ citas = [], fecha = '' }) {
    const [busqueda, setBusqueda] = useState('');
    const [cargandoFecha, setCargandoFecha] = useState(false);

    const hoyStr = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const mananaStr = useMemo(() => sumarDias(hoyStr, 1), [hoyStr]);
    const esHoy = fecha === hoyStr;

    const citasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return citas;
        return citas.filter((cita) => {
            const enCliente = (cita.cliente || '').toLowerCase().includes(q);
            const enEmail = (cita.email || '').toLowerCase().includes(q);
            const enTel = (cita.telefono || '').toLowerCase().includes(q);
            const enServicios = (cita.servicios || []).some((s) =>
                (s.nombre || '').toLowerCase().includes(q)
            );
            return enCliente || enEmail || enTel || enServicios;
        });
    }, [citas, busqueda]);

    const totalDia = citasFiltradas.reduce(
        (acc, cita) => acc + Number(cita.total || 0),
        0
    );

    const totalCobrado = citasFiltradas.reduce((acc, cita) => {
        if (cita.pago?.estado === 'pagado') {
            return acc + Number(cita.pago.monto || cita.total || 0);
        }
        return acc;
    }, 0);

    const navegarAFecha = (nuevaFecha) => {
        if (!nuevaFecha || nuevaFecha === fecha) return;
        router.get(
            AdminController.index.url({ query: { fecha: nuevaFecha } }),
            {},
            {
                only: ['citas', 'fecha'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setCargandoFecha(true),
                onFinish: () => setCargandoFecha(false),
            }
        );
    };

    const handleCobrarTerminal = async (cita) => {
        if (!cita.pago) return;

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: `Cobrar Cita #${cita.id} en Terminal POS`,
            html: `
                <p style="font-size:1.4rem;color:#b9afa1;margin-bottom:1.2rem;">
                    Monto: <strong style="color:#d4a259;">$${Number(cita.total).toFixed(2)} MXN</strong>
                </p>
                <input id="swal-auth" class="swal2-input" placeholder="Código de autorización (opcional en sandbox)" />
                <input id="swal-last4" class="swal2-input" maxlength="4" placeholder="Últimos 4 dígitos de tarjeta (opcional)" />
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Cobro POS',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
            preConfirm: () => ({
                codigo_autorizacion: document.getElementById('swal-auth')?.value || '',
                ultimos_4: document.getElementById('swal-last4')?.value || '',
            }),
        });

        if (!isConfirmed) return;

        try {
            const { data } = await axios.post(
                PagoController.cobrarEnTerminal.url({ pago: cita.pago.id }),
                formValues
            );

            await Swal.fire({
                icon: 'success',
                title: 'Cobro confirmado',
                text: `Autorización #${data?.pago?.codigo_autorizacion ?? 'OK'} registrada en Terminal POS.`,
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#d4a259',
            });

            router.reload({ only: ['citas'] });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error en Terminal POS',
                text: error?.response?.data?.mensaje || 'No se pudo confirmar el cobro en terminal',
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#b83232',
            });
        }
    };

    const handleEliminar = (e, id) => {
        e.preventDefault();
        router.post(
            APIController.eliminar.url(),
            { id },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['citas'],
            }
        );
    };

    return (
        <>
            <Head title="Panel de Administración" />

            <h1 className="nombre-pagina">Panel de Administración</h1>
            <p className="descripcion-pagina">Agenda diaria, pagos y control de citas de la barbería</p>

            <Barra />

            <section className="agenda-control">
                <div className="agenda-control-header">
                    <div>
                        <span className="agenda-etiqueta">Agenda seleccionada</span>
                        <h2 className="agenda-fecha-titulo">
                            {formatearFechaLarga(fecha)}
                            {esHoy && <span className="badge-hoy">HOY</span>}
                        </h2>
                    </div>
                    <div className="agenda-nav-rapida">
                        <button
                            type="button"
                            className="btn-agenda"
                            onClick={() => navegarAFecha(sumarDias(fecha, -1))}
                            title="Día anterior"
                        >
                            &laquo; Anterior
                        </button>
                        <button
                            type="button"
                            className={`btn-agenda ${esHoy ? 'activo' : ''}`}
                            onClick={() => navegarAFecha(hoyStr)}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            className={`btn-agenda ${fecha === mananaStr ? 'activo' : ''}`}
                            onClick={() => navegarAFecha(mananaStr)}
                        >
                            Mañana
                        </button>
                        <button
                            type="button"
                            className="btn-agenda"
                            onClick={() => navegarAFecha(sumarDias(fecha, 1))}
                            title="Día siguiente"
                        >
                            Siguiente &raquo;
                        </button>
                    </div>
                </div>

                <div className="agenda-filtros-grid">
                    <div className="agenda-campo">
                        <label htmlFor="fecha">Cambiar Fecha</label>
                        <BarberDatePicker
                            id="fecha"
                            value={fecha}
                            onChange={navegarAFecha}
                        />
                    </div>
                    <div className="agenda-campo">
                        <label htmlFor="buscar-cita">Filtrar en este día</label>
                        <input
                            type="search"
                            id="buscar-cita"
                            placeholder="Cliente, teléfono o servicio..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <div className={`agenda-resultados ${cargandoFecha ? 'cargando' : ''}`}>
                <div className="resumen-kpi-grid">
                    <div className="kpi-card">
                        <span className="kpi-label">Citas del día</span>
                        <strong className="kpi-valor">{citasFiltradas.length}</strong>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">Cobrado / Estimado</span>
                        <strong className="kpi-valor">
                            ${totalCobrado.toFixed(2)} / ${totalDia.toFixed(2)}
                        </strong>
                    </div>
                </div>

                {citasFiltradas.length === 0 ? (
                    <div className="estado-vacio">
                        <h2>
                            {busqueda.trim()
                                ? 'Sin coincidencias para tu búsqueda'
                                : 'No Hay Citas en esta fecha'}
                        </h2>
                        <p>
                            {busqueda.trim()
                                ? 'Prueba limpiando el filtro o seleccionando otro día en la agenda.'
                                : 'Usa los controles de fecha arriba para revisar otros días de la semana.'}
                        </p>
                    </div>
                ) : (
                    <div id="citas-admin">
                        <ul className="citas">
                            {citasFiltradas.map((cita) => {
                                const pago = cita.pago;
                                const esPendientePos =
                                    pago && pago.estado !== 'pagado';

                                return (
                                    <li key={cita.id}>
                                        <div className="cita-header">
                                            <span className="cita-badge-hora">{cita.hora} hrs</span>
                                            <span className="cita-id">Folio #{cita.id}</span>
                                        </div>

                                        <p>
                                            Cliente: <span>{cita.cliente}</span>
                                        </p>
                                        <p>
                                            Email: <span>{cita.email}</span>
                                        </p>
                                        <p>
                                            Teléfono: <span>{cita.telefono || 'Sin registro'}</span>
                                        </p>

                                        <h3>Servicios</h3>
                                        {cita.servicios.map((servicio) => (
                                            <p key={`${cita.id}-${servicio.id}`} className="servicio">
                                                <span>{servicio.nombre}</span>
                                                <strong>${Number(servicio.precio).toFixed(2)}</strong>
                                            </p>
                                        ))}

                                        <p className="total">
                                            Total: <span>$ {Number(cita.total).toFixed(2)}</span>
                                        </p>

                                        {pago && (
                                            <div className="cita-pago-box">
                                                <div className="cita-pago-top">
                                                    <span className="pago-meta">
                                                        Método:{' '}
                                                        <strong>
                                                            {pago.metodo === 'tarjeta_online'
                                                                ? 'Tarjeta en Línea'
                                                                : 'Terminal POS'}
                                                        </strong>
                                                    </span>
                                                    <span className={`pago-badge ${pago.estado}`}>
                                                        {pago.estado === 'pagado'
                                                            ? 'PAGADO'
                                                            : pago.estado === 'fallido'
                                                              ? 'FALLIDO'
                                                              : 'PENDIENTE EN TERMINAL'}
                                                    </span>
                                                </div>

                                                {pago.estado === 'pagado' ? (
                                                    <p className="pago-meta">
                                                        Autorización: #{pago.codigo_autorizacion || 'N/A'}
                                                        {pago.ultimos_4
                                                            ? ` · ${pago.marca_tarjeta || 'TARJETA'} •••• ${pago.ultimos_4}`
                                                            : ''}
                                                    </p>
                                                ) : (
                                                    <p className="pago-meta">
                                                        Ref: {pago.referencia_bancaria || 'Pendiente'} · Terminal:{' '}
                                                        {pago.terminal_id || 'POS-BARBER-01'}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="cita-acciones-footer">
                                            {esPendientePos && (
                                                <button
                                                    type="button"
                                                    className="boton"
                                                    onClick={() => handleCobrarTerminal(cita)}
                                                >
                                                    Cobrar en Terminal POS
                                                </button>
                                            )}

                                            <form onSubmit={(e) => handleEliminar(e, cita.id)}>
                                                <input type="hidden" name="id" value={cita.id} />
                                                <input
                                                    type="submit"
                                                    className="boton-eliminar"
                                                    value="Eliminar"
                                                />
                                            </form>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
}
