import { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Barra from '@/Components/Barra';
import BarberDatePicker from '@/Components/BarberDatePicker';
import PaginadorLista from '@/Components/PaginadorLista';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import APIController from '@/actions/App/Http/Controllers/APIController';
import PagoController from '@/actions/App/Http/Controllers/PagoController';

const CITAS_POR_PAGINA = 6;

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

export default function AdminIndex({
    citas = [],
    fecha = '',
    barberos = [],
    barberoFiltro = 'todos',
    soloBarbero = false,
}) {
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [cargandoFecha, setCargandoFecha] = useState(false);

    useEffect(() => {
        setPagina(1);
    }, [fecha, barberoFiltro, busqueda]);

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
            const enBarbero = (cita.barbero || '').toLowerCase().includes(q);
            const enEmail = (cita.email || '').toLowerCase().includes(q);
            const enTel = (cita.telefono || '').toLowerCase().includes(q);
            const enServicios = (cita.servicios || []).some((s) =>
                (s.nombre || '').toLowerCase().includes(q)
            );
            return enCliente || enBarbero || enEmail || enTel || enServicios;
        });
    }, [citas, busqueda]);

    const totalDia = citasFiltradas.reduce(
        (acc, cita) => acc + Number(cita.total || 0),
        0
    );

    const totalCobrado = citasFiltradas.reduce((acc, cita) => {
        if (!cita.pago) return acc;
        if (cita.pago.monto_pagado !== undefined && cita.pago.monto_pagado !== null) {
            return acc + Number(cita.pago.monto_pagado);
        }
        if (cita.pago.estado === 'pagado') {
            return acc + Number(cita.pago.monto || cita.total || 0);
        }
        return acc;
    }, 0);

    const etiquetaMetodoPago = (metodo) => {
        switch (metodo) {
            case 'tarjeta_online':
                return 'Tarjeta en Línea';
            case 'mercadopago':
                return 'Mercado Pago';
            case 'transferencia':
                return 'Transferencia SPEI';
            case 'efectivo':
                return 'Efectivo';
            default:
                return 'Terminal Point';
        }
    };

    const etiquetaEstadoPago = (pago) => {
        if (!pago) return 'PENDIENTE';
        if (pago.estado === 'pagado') return 'PAGADO 100%';
        if (pago.estado === 'anticipo_pagado') return 'ANTICIPO PAGADO';
        if (pago.estado === 'fallido') return 'FALLIDO';
        if (pago.metodo === 'transferencia') return 'PENDIENTE SPEI';
        if (pago.metodo === 'efectivo') return 'PENDIENTE EFECTIVO';
        return 'PENDIENTE EN SUCURSAL';
    };

    const urlWhatsappCliente = (cita) => {
        const digitos = (cita.telefono || '').replace(/\D/g, '');
        if (!digitos) return null;
        const saldo = Number(cita.pago?.saldo_pendiente ?? cita.total ?? 0);
        const texto = encodeURIComponent(
            `Hola ${cita.cliente}! Te confirmamos tu cita #${cita.id} para el ${cita.fecha || fecha} a las ${cita.hora} hrs.` +
                (saldo > 0 ? ` Saldo pendiente: $${saldo.toFixed(2)} MXN.` : ' Tu cita ya está pagada al 100%.')
        );
        return `https://wa.me/${digitos}?text=${texto}`;
    };

    const navegarAgenda = (nuevaFecha, nuevoBarbero = barberoFiltro) => {
        if (!nuevaFecha) return;
        if (nuevaFecha === fecha && String(nuevoBarbero) === String(barberoFiltro)) return;

        const query = { fecha: nuevaFecha };
        if (!soloBarbero && nuevoBarbero && nuevoBarbero !== 'todos') {
            query.barbero_id = nuevoBarbero;
        }

        router.get(AdminController.index.url({ query }), {}, {
            only: ['citas', 'fecha', 'barberoFiltro'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setCargandoFecha(true),
            onFinish: () => setCargandoFecha(false),
        });
    };

    const handleReagendar = async (cita) => {
        const opcionesBarbero = [
            '<option value="">Sin barbero asignado</option>',
            ...barberos.map(
                (b) =>
                    `<option value="${b.id}" ${Number(cita.barberoId) === Number(b.id) ? 'selected' : ''}>${b.nombre_completo || `${b.nombre} ${b.apellido}`}</option>`
            ),
        ].join('');

        const horaCorta = (cita.hora || '10:00').slice(0, 5);

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: `Ajustar / Reagendar Cita #${cita.id}`,
            html: `
                <div style="text-align:left;display:flex;flex-direction:column;gap:10px;font-size:1.4rem;">
                    <label style="color:#b9afa1;">Fecha</label>
                    <input id="swal-fecha" type="date" value="${cita.fecha || fecha}" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;color-scheme:dark;" />
                    <label style="color:#b9afa1;">Hora</label>
                    <input id="swal-hora" type="time" value="${horaCorta}" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;color-scheme:dark;" />
                    <label style="color:#b9afa1;">Barbero</label>
                    <select id="swal-barbero" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;">
                        ${opcionesBarbero}
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Ajuste',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
            preConfirm: () => ({
                fecha: document.getElementById('swal-fecha')?.value || fecha,
                hora: document.getElementById('swal-hora')?.value || horaCorta,
                barberoId: document.getElementById('swal-barbero')?.value || null,
            }),
        });

        if (!isConfirmed) return;

        try {
            await axios.post(
                APIController.reagendar.url({ cita: cita.id }),
                formValues
            );

            await Swal.fire({
                icon: 'success',
                title: 'Cita ajustada',
                text: 'La fecha, hora o barbero se actualizaron correctamente.',
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#d4a259',
            });

            router.reload({ only: ['citas'] });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo reagendar',
                text: error?.response?.data?.message || 'Verifica los datos ingresados',
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#b83232',
            });
        }
    };

    const handleCobrarTerminal = async (cita) => {
        if (!cita.pago) return;

        const saldoPendiente = Number(cita.pago.saldo_pendiente ?? cita.total ?? 0);
        const pagadoPrevio = Number(cita.pago.monto_pagado ?? 0);
        const metodoDefecto =
            cita.pago.metodo === 'efectivo'
                ? 'efectivo'
                : cita.pago.metodo === 'transferencia'
                  ? 'transferencia'
                  : 'terminal_pos';

        const { value: formValues, isConfirmed } = await Swal.fire({
            title: `Liquidar Saldo · Cita #${cita.id}`,
            html: `
                <div style="text-align:left;display:flex;flex-direction:column;gap:10px;font-size:1.4rem;">
                    <p style="margin:0;color:#b9afa1;">
                        Total: <strong style="color:#f5efe6;">$${Number(cita.total).toFixed(2)}</strong>
                        ${pagadoPrevio > 0 ? ` · Anticipo: <strong style="color:#9be3ff;">$${pagadoPrevio.toFixed(2)}</strong>` : ''}
                        <br/>Saldo a liquidar: <strong style="color:#d4a259;font-size:1.6rem;">$${saldoPendiente.toFixed(2)} MXN</strong>
                    </p>
                    <p style="margin:0;font-size:1.25rem;color:#c8bfb2;">
                        Elige cómo pagó realmente el cliente (puedes cambiarlo aunque haya reservado otro método):
                    </p>
                    <label style="color:#b9afa1;">Método de liquidación</label>
                    <select id="swal-metodo" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;">
                        <option value="efectivo" ${metodoDefecto === 'efectivo' ? 'selected' : ''}>Efectivo en Caja (Dinero físico)</option>
                        <option value="transferencia" ${metodoDefecto === 'transferencia' ? 'selected' : ''}>Transferencia Bancaria (SPEI Confirmada)</option>
                        <option value="terminal_pos" ${metodoDefecto === 'terminal_pos' ? 'selected' : ''}>Terminal Mercado Pago Point / Tarjeta</option>
                    </select>
                    <label style="color:#b9afa1;">Folio / Autorización (opcional)</label>
                    <input id="swal-auth" type="text" placeholder="Ej. AUTH-9042 o folio SPEI" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;" />
                    <label style="color:#b9afa1;">Últimos 4 dígitos tarjeta (opcional)</label>
                    <input id="swal-last4" type="text" maxlength="4" placeholder="Ej. 4242" style="padding:10px;border-radius:8px;border:1px solid #554839;background:#141210;color:#f5efe6;" />
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: `Confirmar Liquidación ($${saldoPendiente.toFixed(2)})`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
            preConfirm: () => ({
                metodo_liquidacion: document.getElementById('swal-metodo')?.value || 'terminal_pos',
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
                title: 'Saldo Liquidado',
                text: `Pago completado al 100%. Referencia #${data?.pago?.codigo_autorizacion ?? 'OK'}.`,
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#d4a259',
            });

            router.reload({ only: ['citas'] });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error al registrar cobro',
                text: error?.response?.data?.mensaje || 'No se pudo confirmar la liquidación',
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
            <Head title={soloBarbero ? 'Mi Agenda de Barbero' : 'Panel de Administración'} />

            <h1 className="nombre-pagina">
                {soloBarbero ? 'Mi Agenda de Barbero' : 'Panel de Administración'}
            </h1>
            <p className="descripcion-pagina">
                {soloBarbero
                    ? 'Tus citas asignadas del día y cobro en Terminal POS'
                    : 'Agenda diaria, pagos y control de citas de la barbería'}
            </p>

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
                            onClick={() => navegarAgenda(sumarDias(fecha, -1))}
                            title="Día anterior"
                        >
                            &laquo; Anterior
                        </button>
                        <button
                            type="button"
                            className={`btn-agenda ${esHoy ? 'activo' : ''}`}
                            onClick={() => navegarAgenda(hoyStr)}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            className={`btn-agenda ${fecha === mananaStr ? 'activo' : ''}`}
                            onClick={() => navegarAgenda(mananaStr)}
                        >
                            Mañana
                        </button>
                        <button
                            type="button"
                            className="btn-agenda"
                            onClick={() => navegarAgenda(sumarDias(fecha, 1))}
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
                            onChange={(nueva) => navegarAgenda(nueva)}
                        />
                    </div>

                    {!soloBarbero && barberos.length > 0 && (
                        <div className="agenda-campo">
                            <label htmlFor="filtro-agenda-barbero">Barbero</label>
                            <select
                                id="filtro-agenda-barbero"
                                value={barberoFiltro}
                                onChange={(e) => navegarAgenda(fecha, e.target.value)}
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
                    )}

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
                            {citasFiltradas
                                .slice(
                                    (pagina - 1) * CITAS_POR_PAGINA,
                                    pagina * CITAS_POR_PAGINA
                                )
                                .map((cita) => {
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
                                        {cita.para_quien && cita.para_quien !== 'titular' && (
                                            <p>
                                                Atender a:{' '}
                                                <span>
                                                    {cita.nombre_beneficiario || 'Sin nombre'} (
                                                    {cita.para_quien === 'hijo' ? 'Hijo' : 'Familiar'})
                                                </span>
                                            </p>
                                        )}
                                        {cita.barbero && (
                                            <p>
                                                Barbero: <span>{cita.barbero}</span>
                                            </p>
                                        )}
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
                                                        <strong>{etiquetaMetodoPago(pago.metodo)}</strong>
                                                        {pago.metodo_liquidacion && (
                                                            <> · Liquidado: <strong>{etiquetaMetodoPago(pago.metodo_liquidacion)}</strong></>
                                                        )}
                                                    </span>
                                                    <span className={`pago-badge ${pago.estado}`}>
                                                        {etiquetaEstadoPago(pago)}
                                                    </span>
                                                </div>

                                                <div className="pago-saldos-linea">
                                                    <span>
                                                        Pagado:{' '}
                                                        <strong>
                                                            ${Number(pago.monto_pagado ?? 0).toFixed(2)}
                                                        </strong>
                                                    </span>
                                                    <span>
                                                        Saldo pendiente:{' '}
                                                        <strong className="saldo-pendiente-monto">
                                                            ${Number(pago.saldo_pendiente ?? 0).toFixed(2)}
                                                        </strong>
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
                                                        Ref: {pago.referencia_bancaria || 'Pendiente'}
                                                        {pago.terminal_id ? ` · Terminal: ${pago.terminal_id}` : ''}
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
                                                    {Number(pago.saldo_pendiente ?? cita.total) > 0
                                                        ? `Liquidar $${Number(pago.saldo_pendiente ?? cita.total).toFixed(2)}`
                                                        : 'Confirmar Cobro'}
                                                </button>
                                            )}

                                            {urlWhatsappCliente(cita) && (
                                                <a
                                                    href={urlWhatsappCliente(cita)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="boton-whatsapp"
                                                >
                                                    WhatsApp
                                                </a>
                                            )}

                                            {!soloBarbero && (
                                                <button
                                                    type="button"
                                                    className="boton-secundario"
                                                    onClick={() => handleReagendar(cita)}
                                                >
                                                    Re-Agendar
                                                </button>
                                            )}

                                            {!soloBarbero && (
                                                <form onSubmit={(e) => handleEliminar(e, cita.id)}>
                                                    <input type="hidden" name="id" value={cita.id} />
                                                    <input
                                                        type="submit"
                                                        className="boton-eliminar"
                                                        value="Eliminar"
                                                    />
                                                </form>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <PaginadorLista
                            total={citasFiltradas.length}
                            paginaActual={pagina}
                            porPagina={CITAS_POR_PAGINA}
                            onCambiarPagina={setPagina}
                            etiqueta="citas"
                        />
                    </div>
                )}
            </div>
        </>
    );
}
