import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Barra from '@/Components/Barra';
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

export default function CitaIndex({ serviciosIniciales = [], hoy = '' }) {
    const { auth } = usePage().props;
    const usuario = auth?.user;

    const [paso, setPaso] = useState(PASO_INICIAL);
    const [servicios, setServicios] = useState(serviciosIniciales);
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [alertaFormulario, setAlertaFormulario] = useState(null);
    const [guardando, setGuardando] = useState(false);

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

    const handleFechaChange = (e) => {
        const valor = e.target.value;
        if (!valor) {
            setFecha('');
            return;
        }
        const dia = new Date(valor).getUTCDay();
        if (dia === 0) {
            setFecha('');
            mostrarAlertaTemporal(
                'Domingos No Trabajamos, Elije otro día de Lunes a Sábado',
                'error'
            );
        } else {
            setFecha(valor);
        }
    };

    const handleHoraChange = (e) => {
        const valor = e.target.value;
        if (!valor) {
            setHora('');
            return;
        }
        const horaNum = parseInt(valor.split(':')[0], 10);
        if (horaNum < 10 || horaNum > 19) {
            setHora('');
            mostrarAlertaTemporal('Hora No Válida', 'error');
        } else {
            setHora(valor);
        }
    };

    const datosCompletos = useMemo(() => {
        return Boolean(
            usuario?.id &&
            usuario?.nombreCompleto &&
            fecha &&
            hora &&
            serviciosSeleccionados.length > 0
        );
    }, [usuario, fecha, hora, serviciosSeleccionados]);

    const reservarCita = async () => {
        if (!datosCompletos || guardando) return;

        setGuardando(true);
        try {
            const payload = {
                fecha,
                hora,
                usuarioId: usuario.id,
                nombre: usuario.nombreCompleto,
                servicios: serviciosSeleccionados.map((s) => s.id),
            };

            const { data } = await axios.post(APIController.guardar.url(), payload);

            if (data?.resultado) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Cita Creada',
                    text: 'Tu cita fue creada correctamente',
                    confirmButtonText: 'OK',
                });

                setServiciosSeleccionados([]);
                setFecha('');
                setHora('');
                setPaso(PASO_INICIAL);
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al guardar la cita',
            });
        } finally {
            setGuardando(false);
        }
    };

    const fechaMin = hoy || new Date().toISOString().split('T')[0];

    return (
        <>
            <Head title="Crear Nueva Cita" />

            <h1 className="nombre-pagina">Crear Nueva Cita</h1>
            <p className="descripcion-pagina">Elige tus servicios y coloca tus datos</p>

            <Barra />

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
                        Información Cita
                    </button>
                    <button
                        className={paso === 3 ? 'actual' : ''}
                        type="button"
                        data-paso="3"
                        onClick={() => setPaso(3)}
                    >
                        Resumen
                    </button>
                </nav>

                <div id="paso-1" className={`seccion ${paso === 1 ? 'mostrar' : ''}`}>
                    <h2>Servicios</h2>
                    <p className="text-center">Da Click &amp; Elige tus servicios a continuación</p>
                    <div id="servicios" className="listado-servicios">
                        {servicios.map((servicio) => {
                            const seleccionado = serviciosSeleccionados.some(
                                (s) => s.id === servicio.id
                            );
                            return (
                                <div
                                    key={servicio.id}
                                    className={`servicio ${seleccionado ? 'seleccionado' : ''}`}
                                    data-id-servicio={servicio.id}
                                    onClick={() => toggleServicio(servicio)}
                                >
                                    <p className="nombre-servicio">{servicio.nombre}</p>
                                    <p className="precio-servicio">${servicio.precio}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div id="paso-2" className={`seccion ${paso === 2 ? 'mostrar' : ''}`}>
                    <h2>Tus Datos y Cita</h2>
                    <p className="text-center">Coloca tus datos y fecha de tu cita</p>

                    <form className="formulario" onSubmit={(e) => e.preventDefault()}>
                        <div className="campo">
                            <label htmlFor="nombre">Nombre</label>
                            <input
                                id="nombre"
                                type="text"
                                placeholder="Tu Nombre"
                                value={usuario?.nombreCompleto ?? ''}
                                disabled
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="fecha">Fecha</label>
                            <input
                                id="fecha"
                                type="date"
                                min={fechaMin}
                                value={fecha}
                                onChange={handleFechaChange}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="hora">Hora</label>
                            <input
                                id="hora"
                                type="time"
                                value={hora}
                                onChange={handleHoraChange}
                            />
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
                            Faltan datos de Servicios, Fecha u Hora
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
                                <span>Nombre:</span> {usuario?.nombreCompleto}
                            </p>
                            <p>
                                <span>Fecha:</span> {formatearFechaMX(fecha)}
                            </p>
                            <p>
                                <span>Hora:</span> {hora} Horas
                            </p>

                            <button
                                type="button"
                                className="boton"
                                onClick={reservarCita}
                                disabled={guardando}
                            >
                                {guardando ? 'Reservando...' : 'Reservar Cita'}
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
