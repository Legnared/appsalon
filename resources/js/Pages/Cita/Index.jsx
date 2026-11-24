import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Barra from '@/Components/Barra';
import BarberDatePicker from '@/Components/BarberDatePicker';
import GuiaTipoRostro, { TIPOS_ROSTRO } from '@/Components/GuiaTipoRostro';
import MetodoPagoSelector from '@/Components/MetodoPagoSelector';
import APIController from '@/actions/App/Http/Controllers/APIController';

const PASO_INICIAL = 1;
const PASO_FINAL = 3;

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

export default function CitaIndex({
    serviciosIniciales = [],
    barberosActivos = [],
    barberoPreferidoId = null,
    diasCerrados = [0],
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
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
    const [barberoId, setBarberoId] = useState(barberoInicial);
    const [paraQuien, setParaQuien] = useState('titular');
    const [nombreBeneficiario, setNombreBeneficiario] = useState('');
    const [verMisCitasMovil, setVerMisCitasMovil] = useState(false);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [slotsHorario, setSlotsHorario] = useState([]);
    const [cargandoHorarios, setCargandoHorarios] = useState(false);
    const [alertaFormulario, setAlertaFormulario] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [metodoPago, setMetodoPago] = useState('tarjeta_online');
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

    // Consultar disponibilidad real (margen 60 min) cuando cambia fecha o barbero
    useEffect(() => {
        if (!fecha) {
            setSlotsHorario([]);
            return;
        }

        let cancelado = false;
        setCargandoHorarios(true);

        const query = { fecha };
        if (barberoId) query.barbero_id = barberoId;

        axios
            .get(APIController.disponibilidad.url({ query }))
            .then((res) => {
                if (cancelado) return;
                const nuevosSlots = res.data?.slots ?? [];
                setSlotsHorario(nuevosSlots);
                if (hora && !nuevosSlots.some((s) => s.hora === hora && s.disponible)) {
                    setHora('');
                }
            })
            .catch(() => {
                if (!cancelado) setSlotsHorario([]);
            })
            .finally(() => {
                if (!cancelado) setCargandoHorarios(false);
            });

        return () => {
            cancelado = true;
        };
    }, [fecha, barberoId]);

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

    const reservarCita = async () => {
        if (!datosCompletos || guardando) return;

        if (metodoPago === 'tarjeta_online') {
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
                metodo_pago: metodoPago,
                terminal_modo: terminalModo,
                ...(metodoPago === 'tarjeta_online'
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
                const detallePago =
                    pago?.estado === 'pagado'
                        ? `Pago aprobado · Autorización #${pago.codigo_autorizacion} (${pago.marca_tarjeta} •••• ${pago.ultimos_4})`
                        : `Reserva confirmada · Pago pendiente en Terminal POS (Ref. ${pago?.referencia_bancaria ?? 'POS'})`;

                await Swal.fire({
                    icon: 'success',
                    title: 'Cita Creada',
                    text: `Tu cita #${data.id} fue creada correctamente. ${detallePago}`,
                    confirmButtonText: 'OK',
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

    const serviciosMostrados = useMemo(() => {
        if (!tipoRostroFiltro) return servicios;
        const filtrados = servicios.filter(
            (s) => Array.isArray(s.tipos_rostro) && s.tipos_rostro.includes(tipoRostroFiltro)
        );
        return filtrados.length > 0 ? filtrados : servicios;
    }, [servicios, tipoRostroFiltro]);

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
                        {serviciosMostrados.map((servicio) => {
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
                                        return (
                                            <button
                                                key={barbero.id}
                                                type="button"
                                                className={`barbero-option-card ${activo ? 'activo' : ''}`}
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
                                      ? `Pagar $${totalServicios.toFixed(2)} y Reservar Cita`
                                      : 'Reservar Cita (Pago en Terminal)'}
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
