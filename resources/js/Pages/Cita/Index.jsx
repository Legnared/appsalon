import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Barra from '@/Components/Barra';
import BarberDatePicker from '@/Components/BarberDatePicker';
import GuiaTipoRostro, { TIPOS_ROSTRO } from '@/Components/GuiaTipoRostro';
import MetodoPagoSelector, { calcularMontoAnticipo } from '@/Components/MetodoPagoSelector';
import PaginadorLista from '@/Components/PaginadorLista';
import APIController from '@/actions/App/Http/Controllers/APIController';

const PASO_INICIAL = 1;
const PASO_FINAL = 3;
const CATALOGO_POR_PAGINA = 6;

function formatearFechaMX(fechaStr) {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-').map(Number);
    if (!year || !month || !day) return fechaStr;
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return fechaUTC.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

function formatearFechaCortaMX(fechaStr) {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-').map(Number);
    if (!year || !month || !day) return fechaStr;
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return fechaUTC.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
}

export default function CitaIndex({
    serviciosIniciales = [],
    barberosActivos = [],
    ausenciasProximas = [],
    barberoPreferidoId = null,
    diasCerrados = [0],
    pagoConfig = {},
    hoy = '',
}) {
    const { auth, misReservaciones = [] } = usePage().props;
    const usuario = auth?.user;

    const barberoInicial = useMemo(() => {
        if (barberoPreferidoId && barberosActivos.some((b) => b.id === barberoPreferidoId)) {
            return barberoPreferidoId;
        }
        return barberosActivos[0]?.id ?? null;
    }, [barberoPreferidoId, barberosActivos]);

    const [paso, setPaso] = useState(PASO_INICIAL);
    const [servicios, setServicios] = useState(serviciosIniciales);
    const [tipoRostroFiltro, setTipoRostroFiltro] = useState('');
    const [paginaServicios, setPaginaServicios] = useState(1);
    const [paginaProductos, setPaginaProductos] = useState(1);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
    const [barberoId, setBarberoId] = useState(barberoInicial);
    const [paraQuien, setParaQuien] = useState('titular');
    const [nombreBeneficiario, setNombreBeneficiario] = useState('');
    const [verMisCitasMovil, setVerMisCitasMovil] = useState(false);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [slotsHorario, setSlotsHorario] = useState([]);
    const [ausenciaSeleccionada, setAusenciaSeleccionada] = useState(null);
    const [cargandoHorarios, setCargandoHorarios] = useState(false);
    const [alertaFormulario, setAlertaFormulario] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [tipoCobro, setTipoCobro] = useState('anticipo');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [terminalModo, setTerminalModo] = useState('en_sucursal');
    const [tarjeta, setTarjeta] = useState({
        titular: usuario?.nombreCompleto ?? '',
        numero: '',
        expiracion: '',
        cvv: '',
    });

    const timerRef = useRef(null);

    useEffect(() => {
        if (serviciosIniciales.length === 0) {
            axios
                .get(APIController.index.url())
                .then((res) => setServicios(res.data || []))
                .catch(() => {});
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [serviciosIniciales]);

    // Consultar disponibilidad real (margen 60 min + ausencias por barbero) cuando cambia fecha o barbero
    useEffect(() => {
        if (!fecha) {
            setSlotsHorario([]);
            setAusenciaSeleccionada(null);
            return;
        }

        let cancelado = false;
        setCargandoHorarios(true);
        setAusenciaSeleccionada(null);

        const query = { fecha };
        if (barberoId) query.barbero_id = barberoId;

        axios
            .get(APIController.disponibilidad.url({ query }))
            .then((res) => {
                if (cancelado) return;
                if (res.data?.barbero_ausente) {
                    setAusenciaSeleccionada({
                        barbero_id: res.data.barbero_id,
                        barbero_nombre: res.data.barbero_nombre || 'El barbero seleccionado',
                        motivo: res.data.motivo_ausencia || 'No disponible',
                        fecha_inicio: res.data.ausencia_fecha_inicio,
                        fecha_fin: res.data.ausencia_fecha_fin,
                    });
                    setSlotsHorario([]);
                    setHora('');
                    return;
                }
                const nuevosSlots = res.data?.slots ?? [];
                setSlotsHorario(nuevosSlots);
                if (hora && !nuevosSlots.some((s) => s.hora === hora && s.disponible)) {
                    setHora('');
                }
            })
            .catch(() => {
                if (!cancelado) {
                    setSlotsHorario([]);
                    setAusenciaSeleccionada(null);
                }
            })
            .finally(() => {
                if (!cancelado) setCargandoHorarios(false);
            });

        return () => {
            cancelado = true;
        };
    }, [fecha, barberoId]);

    const obtenerAusenciaEnFecha = (idBarbero, fechaObjetivo) => {
        if (!idBarbero || !fechaObjetivo) return null;
        return (
            ausenciasProximas.find(
                (a) =>
                    Number(a.barbero_id) === Number(idBarbero) &&
                    a.fecha_inicio <= fechaObjetivo &&
                    a.fecha_fin >= fechaObjetivo
            ) || null
        );
    };

    const barberosAlternativosEnFecha = useMemo(() => {
        if (!fecha) return [];
        return barberosActivos.filter(
            (b) => b.id !== barberoId && !obtenerAusenciaEnFecha(b.id, fecha)
        );
    }, [barberosActivos, barberoId, fecha, ausenciasProximas]);

    const mostrarAlertaTemporal = (mensaje, tipo = 'error') => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setAlertaFormulario({ mensaje, tipo });
        timerRef.current = setTimeout(() => {
            setAlertaFormulario(null);
        }, 3000);
    };

    const toggleServicio = (servicio) => {
        setServiciosSeleccionados((prev) => {
            const existe = prev.some((s) => s.id === servicio.id);
            if (existe) {
                return prev.filter((s) => s.id !== servicio.id);
            }
            return [...prev, servicio];
        });
    };

    const handleFechaSeleccionada = (valor) => {
        if (!valor) {
            setFecha('');
            setHora('');
            return;
        }
        const dia = new Date(valor).getUTCDay();
        if (diasCerrados.includes(dia)) {
            setFecha('');
            setHora('');
            mostrarAlertaTemporal(
                'Ese día la barbería permanece cerrada. Elige otro día laboral.',
                'error'
            );
        } else {
            setFecha(valor);
        }
    };

    const barberoSeleccionado = useMemo(() => {
        return barberosActivos.find((b) => b.id === barberoId) ?? null;
    }, [barberosActivos, barberoId]);

    const datosCompletos = useMemo(() => {
        const requiereBarbero = barberosActivos.length > 0;
        const beneficiarioValido =
            paraQuien === 'titular' || nombreBeneficiario.trim().length >= 2;
        return Boolean(
            usuario?.id &&
            usuario?.nombreCompleto &&
            fecha &&
            hora &&
            serviciosSeleccionados.length > 0 &&
            beneficiarioValido &&
            (!requiereBarbero || barberoId)
        );
    }, [usuario, fecha, hora, serviciosSeleccionados, barberosActivos, barberoId, paraQuien, nombreBeneficiario]);

    const totalServicios = useMemo(() => {
        return serviciosSeleccionados.reduce((acc, s) => acc + Number(s.precio || 0), 0);
    }, [serviciosSeleccionados]);

    const montoAnticipoActual = useMemo(() => {
        return calcularMontoAnticipo(totalServicios, pagoConfig);
    }, [totalServicios, pagoConfig]);

    const montoAPagarAhora = useMemo(() => {
        if (metodoPago === 'terminal_pos' || metodoPago === 'efectivo') return 0;
        const puedeAnticipo = totalServicios > montoAnticipoActual && montoAnticipoActual > 0;
        return tipoCobro === 'anticipo' && puedeAnticipo ? montoAnticipoActual : totalServicios;
    }, [metodoPago, tipoCobro, totalServicios, montoAnticipoActual]);

    const reservarCita = async () => {
        if (!datosCompletos || guardando) return;

        const esMercadoPagoPro = pagoConfig?.driver === 'mercadopago';
        if (metodoPago === 'tarjeta_online' && !esMercadoPagoPro) {
            const digitos = tarjeta.numero.replace(/\D/g, '');
            if (
                !tarjeta.titular.trim() ||
                digitos.length < 15 ||
                tarjeta.expiracion.length < 5 ||
                tarjeta.cvv.length < 3
            ) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos de tarjeta incompletos',
                    text: 'Verifica el titular, número de tarjeta, expiración (MM/AA) y CVV.',
                    background: '#1f1b17',
                    color: '#f5efe6',
                    confirmButtonColor: '#d4a259',
                });
                return;
            }
        }

        setGuardando(true);
        try {
            const payload = {
                fecha,
                hora,
                barberoId,
                para_quien: paraQuien,
                nombre_beneficiario: paraQuien === 'titular' ? null : nombreBeneficiario.trim(),
                usuarioId: usuario.id,
                nombre: usuario.nombreCompleto,
                servicios: serviciosSeleccionados.map((s) => s.id),
                tipo_cobro:
                    metodoPago === 'terminal_pos' || metodoPago === 'efectivo'
                        ? 'total'
                        : tipoCobro,
                metodo_pago: metodoPago,
                terminal_modo: terminalModo,
                ...(metodoPago === 'tarjeta_online' && !esMercadoPagoPro
                    ? {
                          tarjeta_titular: tarjeta.titular,
                          tarjeta_numero: tarjeta.numero,
                          tarjeta_expiracion: tarjeta.expiracion,
                          tarjeta_cvv: tarjeta.cvv,
                      }
                    : {}),
            };

            const { data } = await axios.post(APIController.guardar.url(), payload);

            if (data?.resultado) {
                const pago = data.pago;
                const telNegocio = (pagoConfig?.whatsapp_negocio || '5216312487987').replace(/\D/g, '');
                let htmlDetalle = '';

                if (pago?.metodo === 'transferencia') {
                    const textoWa = encodeURIComponent(
                        `Hola! Acabo de agendar mi cita #${data.id} para el ${fecha} a las ${hora} hrs. ` +
                            `Adjunto mi comprobante SPEI (${pago.tipo_cobro === 'anticipo' ? 'Anticipo' : 'Pago total'} por $${Number(pago.monto).toFixed(2)} MXN). ` +
                            `Ref: ${pago.referencia_bancaria}`
                    );
                    const urlWa = `https://wa.me/${telNegocio}?text=${textoWa}`;
                    htmlDetalle = `
                        <p style="margin:0 0 1rem;color:#e8dfd2;">Tu cita <strong>#${data.id}</strong> quedó apartada.</p>
                        <p style="margin:0 0 1rem;font-size:1.35rem;color:#b9afa1;">
                            Transfiere <strong style="color:#d4a259;">$${Number(pago.monto).toFixed(2)} MXN</strong> con referencia <strong>${pago.referencia_bancaria}</strong> y envía tu comprobante:
                        </p>
                        <a href="${urlWa}" target="_blank" rel="noopener noreferrer"
                           style="display:inline-block;padding:1rem 1.8rem;border-radius:0.9rem;background:#25d366;color:#111;font-weight:700;text-decoration:none;font-size:1.45rem;">
                           Enviar Comprobante por WhatsApp
                        </a>
                    `;
                } else if (pago?.link_pago) {
                    htmlDetalle = `
                        <p style="margin:0 0 1rem;color:#e8dfd2;">Tu cita <strong>#${data.id}</strong> fue creada.</p>
                        <p style="margin:0 0 1.2rem;font-size:1.35rem;color:#b9afa1;">
                            Completa tu pago de <strong style="color:#d4a259;">$${Number(pago.monto).toFixed(2)} MXN</strong> en Mercado Pago:
                        </p>
                        <a href="${pago.link_pago}" target="_blank" rel="noopener noreferrer"
                           style="display:inline-block;padding:1rem 1.8rem;border-radius:0.9rem;background:#009ee3;color:#fff;font-weight:700;text-decoration:none;font-size:1.45rem;">
                           Ir a Pagar en Mercado Pago
                        </a>
                    `;
                } else if (pago?.estado === 'pagado' || pago?.estado === 'anticipo_pagado') {
                    const saldoTxt =
                        Number(pago.saldo_pendiente || 0) > 0
                            ? `<br/>Saldo restante en barbería: <strong style="color:#d4a259;">$${Number(pago.saldo_pendiente).toFixed(2)} MXN</strong>`
                            : '<br/>Tu cita está pagada al 100%.';
                    htmlDetalle = `
                        <p style="color:#e8dfd2;">Tu cita <strong>#${data.id}</strong> fue creada correctamente.</p>
                        <p style="font-size:1.35rem;color:#b9afa1;">
                            Pago aprobado por <strong>$${Number(pago.monto_pagado).toFixed(2)} MXN</strong> · Autorización #${pago.codigo_autorizacion}
                            ${pago.ultimos_4 ? `(${pago.marca_tarjeta} •••• ${pago.ultimos_4})` : ''}
                            ${saldoTxt}
                        </p>
                    `;
                } else {
                    htmlDetalle = `
                        <p style="color:#e8dfd2;">Tu cita <strong>#${data.id}</strong> fue confirmada.</p>
                        <p style="font-size:1.35rem;color:#b9afa1;">
                            Saldo a liquidar en barbería (Terminal Point o Efectivo): <strong style="color:#d4a259;">$${Number(pago?.saldo_pendiente ?? totalServicios).toFixed(2)} MXN</strong>
                        </p>
                    `;
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Cita Creada',
                    html: htmlDetalle,
                    confirmButtonText: 'Entendido',
                    background: '#1f1b17',
                    color: '#f5efe6',
                    confirmButtonColor: '#d4a259',
                });

                setServiciosSeleccionados([]);
                setFecha('');
                setHora('');
                setParaQuien('titular');
                setNombreBeneficiario('');
                setTarjeta((prev) => ({ ...prev, numero: '', expiracion: '', cvv: '' }));
                setPaso(PASO_INICIAL);
                router.reload({ only: ['misReservaciones'] });
            }
        } catch (error) {
            const mensaje =
                error?.response?.data?.mensaje ||
                error?.response?.data?.message ||
                'Hubo un error al guardar la cita o procesar el pago';
            Swal.fire({
                icon: 'error',
                title: 'Error en la reserva',
                text: mensaje,
                background: '#1f1b17',
                color: '#f5efe6',
                confirmButtonColor: '#b83232',
            });
        } finally {
            setGuardando(false);
        }
    };

    const soloServicios = useMemo(() => {
        return servicios.filter((s) => (s.tipo || 'servicio') !== 'producto');
    }, [servicios]);

    const productosDisponibles = useMemo(() => {
        return servicios.filter((s) => s.tipo === 'producto');
    }, [servicios]);

    const serviciosMostrados = useMemo(() => {
        if (!tipoRostroFiltro) return soloServicios;
        const filtrados = soloServicios.filter(
            (s) => Array.isArray(s.tipos_rostro) && s.tipos_rostro.includes(tipoRostroFiltro)
        );
        return filtrados.length > 0 ? filtrados : soloServicios;
    }, [soloServicios, tipoRostroFiltro]);

    useEffect(() => {
        setPaginaServicios(1);
    }, [tipoRostroFiltro]);

    const serviciosPaginados = useMemo(() => {
        const inicio = (paginaServicios - 1) * CATALOGO_POR_PAGINA;
        return serviciosMostrados.slice(inicio, inicio + CATALOGO_POR_PAGINA);
    }, [serviciosMostrados, paginaServicios]);

    const productosPaginados = useMemo(() => {
        const inicio = (paginaProductos - 1) * CATALOGO_POR_PAGINA;
        return productosDisponibles.slice(inicio, inicio + CATALOGO_POR_PAGINA);
    }, [productosDisponibles, paginaProductos]);

    const nombreRostroFiltro = useMemo(() => {
        return TIPOS_ROSTRO.find((t) => t.id === tipoRostroFiltro)?.nombre ?? '';
    }, [tipoRostroFiltro]);

    const fechaMin = hoy || new Date().toISOString().split('T')[0];

    return (
        <>
            <Head title="Crear Nueva Cita" />

            <h1 className="nombre-pagina">Crear Nueva Cita</h1>
            <p className="descripcion-pagina">Elige tus servicios, barbero y horario disponible</p>

            <Barra />

            {ausenciasProximas.length > 0 && (
                <div
                    role="status"
                    style={{
                        margin: '0 0 2rem',
                        padding: '1.4rem 1.8rem',
                        borderRadius: '1.1rem',
                        border: '1px solid rgba(212, 162, 89, 0.45)',
                        background: 'rgba(212, 162, 89, 0.1)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            marginBottom: '0.8rem',
                            fontWeight: 700,
                            fontSize: '1.45rem',
                            color: '#f0c674',
                        }}
                    >
                        <span>Aviso de Disponibilidad de Barberos</span>
                    </div>
                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: '1.8rem',
                            display: 'grid',
                            gap: '0.45rem',
                            fontSize: '1.35rem',
                            color: '#f5efe6',
                            lineHeight: 1.45,
                        }}
                    >
                        {ausenciasProximas.map((a) => {
                            const mismoDia = a.fecha_inicio === a.fecha_fin;
                            const rangoTexto = mismoDia
                                ? `el ${formatearFechaCortaMX(a.fecha_inicio)}`
                                : `del ${formatearFechaCortaMX(a.fecha_inicio)} al ${formatearFechaCortaMX(a.fecha_fin)}`;
                            return (
                                <li key={a.id}>
                                    <strong>{a.barbero_nombre}</strong> no laborará {rangoTexto}
                                    {a.motivo ? ` (${a.motivo})` : ''}.
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {misReservaciones.length > 0 && (
                <div className="mobile-mis-citas-box">
                    <button
                        type="button"
                        className="mobile-mis-citas-toggle"
                        onClick={() => setVerMisCitasMovil((v) => !v)}
                    >
                        <span>Mis Próximas Citas ({misReservaciones.length})</span>
                        <strong>{verMisCitasMovil ? 'Ocultar' : 'Ver resumen'}</strong>
                    </button>

                    {verMisCitasMovil && (
                        <ul className="sidebar-res-list">
                            {misReservaciones.map((res) => (
                                <li key={res.id} className="sidebar-res-card">
                                    <div className="res-top">
                                        <span className="res-fecha">
                                            {res.fecha} · {res.hora} hrs
                                        </span>
                                        <span
                                            className={`res-pago-dot ${res.pago_estado === 'pagado' ? 'pagado' : 'pendiente'}`}
                                        >
                                            {res.pago_estado === 'pagado' ? 'Pagado' : 'Terminal POS'}
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
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div id="app">
                <nav className="tabs">
                    <button
                        className={paso === 1 ? 'actual' : ''}
                        type="button"
                        data-paso="1"
                        onClick={() => setPaso(1)}
                    >
                        Servicios
                    </button>
                    <button
                        className={paso === 2 ? 'actual' : ''}
                        type="button"
                        data-paso="2"
                        onClick={() => setPaso(2)}
                    >
                        Barbero y Fecha
                    </button>
                    <button
                        className={paso === 3 ? 'actual' : ''}
                        type="button"
                        data-paso="3"
                        onClick={() => setPaso(3)}
                    >
                        Resumen y Pago
                    </button>
                </nav>

                <div id="paso-1" className={`seccion ${paso === 1 ? 'mostrar' : ''}`}>
                    <h2>Servicios</h2>
                    <p className="text-center">Da Click &amp; Elige tus servicios a continuación</p>

                    <GuiaTipoRostro
                        seleccionado={tipoRostroFiltro}
                        onSeleccionar={setTipoRostroFiltro}
                    />

                    <div id="servicios" className="listado-servicios">
                        {serviciosPaginados.map((servicio) => {
                            const seleccionado = serviciosSeleccionados.some(
                                (s) => s.id === servicio.id
                            );
                            const esRecomendado =
                                tipoRostroFiltro &&
                                Array.isArray(servicio.tipos_rostro) &&
                                servicio.tipos_rostro.includes(tipoRostroFiltro);

                            return (
                                <div
                                    key={servicio.id}
                                    className={`servicio ${seleccionado ? 'seleccionado' : ''} ${esRecomendado ? 'recomendado-rostro' : ''}`}
                                    data-id-servicio={servicio.id}
                                    onClick={() => toggleServicio(servicio)}
                                >
                                    {esRecomendado && (
                                        <span className="badge-visagismo">
                                            Ideal para rostro {nombreRostroFiltro}
                                        </span>
                                    )}
                                    {servicio.imagen_url && (
                                        <div className="servicio-foto">
                                            <img
                                                src={servicio.imagen_url}
                                                alt={servicio.nombre}
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <p className="nombre-servicio">{servicio.nombre}</p>
                                    {servicio.descripcion && (
                                        <p className="descripcion-servicio">
                                            {servicio.descripcion}
                                        </p>
                                    )}
                                    {servicio.recomendacion_rostro && (
                                        <p className="tip-visagismo">
                                            {servicio.recomendacion_rostro}
                                        </p>
                                    )}
                                    <div className="servicio-footer-meta">
                                        <span className="duracion-servicio">
                                            {servicio.duracion_minutos || 30} min
                                        </span>
                                        <p className="precio-servicio">${servicio.precio}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <PaginadorLista
                        total={serviciosMostrados.length}
                        paginaActual={paginaServicios}
                        porPagina={CATALOGO_POR_PAGINA}
                        onCambiarPagina={setPaginaServicios}
                        etiqueta="servicios"
                        scrollTarget="#servicios"
                    />

                    {productosDisponibles.length > 0 && (
                        <div id="productos-cuidado" style={{ marginTop: '3.2rem' }}>
                            <h2>Productos de Cuidado Masculino</h2>
                            <p className="text-center">
                                Agrega pomadas, ceras, aceites o bálsamos a tu cita para recoger en
                                barbería
                            </p>

                            <div className="listado-servicios">
                                {productosPaginados.map((producto) => {
                                    const seleccionado = serviciosSeleccionados.some(
                                        (s) => s.id === producto.id
                                    );
                                    const agotado =
                                        producto.stock !== null &&
                                        producto.stock !== undefined &&
                                        Number(producto.stock) <= 0;

                                    return (
                                        <div
                                            key={producto.id}
                                            className={`servicio ${seleccionado ? 'seleccionado' : ''}`}
                                            style={
                                                agotado
                                                    ? { opacity: 0.55, cursor: 'not-allowed' }
                                                    : undefined
                                            }
                                            data-id-servicio={producto.id}
                                            onClick={() => {
                                                if (!agotado) toggleServicio(producto);
                                            }}
                                        >
                                            {producto.imagen_url && (
                                                <div className="servicio-foto">
                                                    <img
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                            <p className="nombre-servicio">{producto.nombre}</p>
                                            {producto.descripcion && (
                                                <p className="descripcion-servicio">
                                                    {producto.descripcion}
                                                </p>
                                            )}
                                            <div className="servicio-footer-meta">
                                                <span className="duracion-servicio">
                                                    {agotado
                                                        ? 'Agotado'
                                                        : producto.stock !== null &&
                                                            producto.stock !== undefined
                                                          ? `Producto · ${producto.stock} disp.`
                                                          : 'Producto'}
                                                </span>
                                                <p className="precio-servicio">
                                                    ${producto.precio}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <PaginadorLista
                                total={productosDisponibles.length}
                                paginaActual={paginaProductos}
                                porPagina={CATALOGO_POR_PAGINA}
                                onCambiarPagina={setPaginaProductos}
                                etiqueta="productos"
                                scrollTarget="#productos-cuidado"
                            />
                        </div>
                    )}
                </div>

                <div id="paso-2" className={`seccion ${paso === 2 ? 'mostrar' : ''}`}>
                    <h2>Tu Barbero y Horario</h2>
                    <p className="text-center">
                        Elige con quién atenderte; respetamos 1 hora entre citas para evitar empalmes
                    </p>

                    <form className="formulario" onSubmit={(e) => e.preventDefault()}>
                        <div className="campo">
                            <label htmlFor="nombre">Titular</label>
                            <input
                                id="nombre"
                                type="text"
                                placeholder="Tu Nombre"
                                value={usuario?.nombreCompleto ?? ''}
                                disabled
                            />
                        </div>

                        <div className="campo campo-columna">
                            <label>¿Para quién es esta cita?</label>
                            <div className="para-quien-grid">
                                {[
                                    { id: 'titular', label: 'Para mí' },
                                    { id: 'hijo', label: 'Para mi hijo' },
                                    { id: 'familiar', label: 'Otro familiar' },
                                ].map((op) => (
                                    <button
                                        key={op.id}
                                        type="button"
                                        className={`para-quien-btn ${paraQuien === op.id ? 'activo' : ''}`}
                                        onClick={() => setParaQuien(op.id)}
                                    >
                                        {op.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paraQuien !== 'titular' && (
                            <div className="campo">
                                <label htmlFor="nombre_beneficiario">
                                    {paraQuien === 'hijo' ? 'Nombre de tu hijo' : 'Nombre del familiar'}
                                </label>
                                <input
                                    id="nombre_beneficiario"
                                    type="text"
                                    placeholder={
                                        paraQuien === 'hijo'
                                            ? 'Ej. Mateo'
                                            : 'Ej. Nombre completo del familiar'
                                    }
                                    value={nombreBeneficiario}
                                    onChange={(e) => setNombreBeneficiario(e.target.value)}
                                />
                            </div>
                        )}

                        {barberosActivos.length > 0 && (
                            <div className="campo campo-columna">
                                <label>Selecciona tu Barbero</label>
                                <div className="selector-barberos-grid">
                                    {barberosActivos.map((barbero) => {
                                        const activo = barberoId === barbero.id;
                                        const ausenciaDia = obtenerAusenciaEnFecha(barbero.id, fecha);
                                        return (
                                            <button
                                                key={barbero.id}
                                                type="button"
                                                className={`barbero-option-card ${activo ? 'activo' : ''}`}
                                                style={ausenciaDia ? { opacity: 0.62 } : undefined}
                                                onClick={() => setBarberoId(barbero.id)}
                                            >
                                                <div className="barbero-avatar">
                                                    {barbero.foto_url ? (
                                                        <img
                                                            src={barbero.foto_url}
                                                            alt={barbero.nombre_completo}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {(barbero.nombre || 'B').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="barbero-option-info">
                                                    <strong>{barbero.nombre_completo}</strong>
                                                    <span>
                                                        {barbero.especialidad || 'Barbero profesional'}
                                                    </span>
                                                    {ausenciaDia && (
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                marginTop: '0.35rem',
                                                                padding: '0.15rem 0.6rem',
                                                                borderRadius: '999px',
                                                                fontSize: '1.1rem',
                                                                fontWeight: 700,
                                                                background: 'rgba(203, 56, 55, 0.22)',
                                                                color: '#ffb4b4',
                                                            }}
                                                        >
                                                            No disponible este día
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="campo">
                            <label htmlFor="fecha">Fecha</label>
                            <BarberDatePicker
                                id="fecha"
                                value={fecha}
                                minDate={fechaMin}
                                disabledDaysOfWeek={diasCerrados}
                                onChange={handleFechaSeleccionada}
                                onSundayBlocked={() =>
                                    mostrarAlertaTemporal(
                                        'Ese día la barbería permanece cerrada. Elige otro día laboral.',
                                        'error'
                                    )
                                }
                                placeholder="Elige el día de tu cita"
                            />
                        </div>

                        <div className="campo campo-columna">
                            <label>Horario Disponible (10:00 – 19:00 · bloques de 1 hora)</label>
                            {!fecha ? (
                                <p className="horarios-ayuda">
                                    Selecciona primero una fecha para consultar horarios libres.
                                </p>
                            ) : cargandoHorarios ? (
                                <p className="horarios-ayuda">Consultando disponibilidad...</p>
                            ) : ausenciaSeleccionada ? (
                                <div
                                    style={{
                                        padding: '1.6rem',
                                        borderRadius: '1rem',
                                        border: '1px solid rgba(212, 162, 89, 0.45)',
                                        background: 'rgba(212, 162, 89, 0.08)',
                                        color: '#f5efe6',
                                        fontSize: '1.4rem',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: '#f0c674' }}>
                                        {ausenciaSeleccionada.barbero_nombre} no labora el{' '}
                                        {formatearFechaMX(fecha)}
                                    </p>
                                    <p style={{ margin: '0 0 1.2rem', color: '#e0d6c8', fontSize: '1.32rem' }}>
                                        Motivo: {ausenciaSeleccionada.motivo}. Puedes elegir otra fecha
                                        o agendar este mismo día con otro barbero disponible:
                                    </p>
                                    {barberosAlternativosEnFecha.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                            {barberosAlternativosEnFecha.map((alt) => (
                                                <button
                                                    key={alt.id}
                                                    type="button"
                                                    className="boton"
                                                    style={{
                                                        margin: 0,
                                                        padding: '0.8rem 1.4rem',
                                                        fontSize: '1.32rem',
                                                    }}
                                                    onClick={() => setBarberoId(alt.id)}
                                                >
                                                    Agendar con {alt.nombre_completo}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: '1.3rem', color: '#b9afa1' }}>
                                            Por favor selecciona otra fecha disponible en el calendario.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="horarios-grid">
                                    {slotsHorario.map((slot) => (
                                        <button
                                            key={slot.hora}
                                            type="button"
                                            disabled={!slot.disponible}
                                            className={`horario-slot ${hora === slot.hora ? 'activo' : ''} ${!slot.disponible ? 'ocupado' : ''}`}
                                            onClick={() => setHora(slot.hora)}
                                        >
                                            <span>{slot.hora}</span>
                                            <small>
                                                {slot.disponible ? 'Disponible' : 'Ocupado'}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {alertaFormulario && (
                            <div className={`alerta ${alertaFormulario.tipo}`}>
                                {alertaFormulario.mensaje}
                            </div>
                        )}
                    </form>
                </div>

                <div
                    id="paso-3"
                    className={`seccion contenido-resumen ${paso === 3 ? 'mostrar' : ''}`}
                >
                    {!datosCompletos ? (
                        <div className="alerta error">
                            Faltan datos de Servicios, Barbero, Fecha u Hora
                        </div>
                    ) : (
                        <>
                            <h3>Resumen de Servicios</h3>
                            {serviciosSeleccionados.map((servicio) => (
                                <div key={servicio.id} className="contenedor-servicio">
                                    <p>{servicio.nombre}</p>
                                    <p>
                                        <span>Precio:</span> ${servicio.precio}
                                    </p>
                                </div>
                            ))}

                            <h3>Resumen de Cita</h3>
                            <p>
                                <span>Titular:</span> {usuario?.nombreCompleto}
                            </p>
                            {paraQuien !== 'titular' && (
                                <p>
                                    <span>
                                        {paraQuien === 'hijo' ? 'Cita para mi hijo:' : 'Cita para familiar:'}
                                    </span>{' '}
                                    {nombreBeneficiario}
                                </p>
                            )}
                            {barberoSeleccionado && (
                                <p>
                                    <span>Barbero:</span> {barberoSeleccionado.nombre_completo}
                                </p>
                            )}
                            <p>
                                <span>Fecha:</span> {formatearFechaMX(fecha)}
                            </p>
                            <p>
                                <span>Hora:</span> {hora} Horas
                            </p>

                            <MetodoPagoSelector
                                total={totalServicios}
                                tipoCobro={tipoCobro}
                                setTipoCobro={setTipoCobro}
                                pagoConfig={pagoConfig}
                                metodoPago={metodoPago}
                                setMetodoPago={setMetodoPago}
                                tarjeta={tarjeta}
                                setTarjeta={setTarjeta}
                                terminalModo={terminalModo}
                                setTerminalModo={setTerminalModo}
                            />

                            <button
                                type="button"
                                className="boton"
                                onClick={reservarCita}
                                disabled={guardando}
                            >
                                {guardando
                                    ? 'Procesando...'
                                    : metodoPago === 'tarjeta_online'
                                      ? `Pagar $${montoAPagarAhora.toFixed(2)} y Reservar Cita`
                                      : metodoPago === 'transferencia'
                                        ? `Reservar y Transferir $${montoAPagarAhora.toFixed(2)} (SPEI)`
                                        : metodoPago === 'efectivo'
                                          ? 'Reservar Cita (Pagar en Efectivo)'
                                          : 'Reservar Cita (Pagar en Terminal)'}
                            </button>
                        </>
                    )}
                </div>

                <div className="paginacion">
                    <button
                        id="anterior"
                        type="button"
                        className={`boton ${paso === PASO_INICIAL ? 'ocultar' : ''}`}
                        onClick={() => setPaso((p) => Math.max(PASO_INICIAL, p - 1))}
                    >
                        &laquo; Anterior
                    </button>

                    <button
                        id="siguiente"
                        type="button"
                        className={`boton ${paso === PASO_FINAL ? 'ocultar' : ''}`}
                        onClick={() => setPaso((p) => Math.min(PASO_FINAL, p + 1))}
                    >
                        Siguiente &raquo;
                    </button>
                </div>
            </div>
        </>
    );
}
