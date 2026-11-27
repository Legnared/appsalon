import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import HorarioController from '@/actions/App/Http/Controllers/HorarioController';

const MOTIVOS_RAPIDOS = [
    'Vacaciones',
    'Compromiso personal',
    'Día libre',
    'Capacitación',
];

function formatearFechaCorta(fechaStr) {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-').map(Number);
    if (!year || !month || !day) return fechaStr;
    const fechaUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return fechaUTC.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

export default function HorariosIndex({
    horarios = [],
    barberos = [],
    ausencias = [],
    hoy = '',
}) {
    const fechaMin = hoy || new Date().toISOString().split('T')[0];

    const { data, setData, post, processing } = useForm({
        horarios: horarios.map((h) => ({
            dia_semana: h.dia_semana,
            nombre_dia: h.nombre_dia,
            abierto: Boolean(h.abierto),
            hora_apertura: (h.hora_apertura || '10:00').slice(0, 5),
            hora_cierre: (h.hora_cierre || '19:00').slice(0, 5),
            intervalo_minutos: Number(h.intervalo_minutos || 60),
        })),
    });

    const ausenciaForm = useForm({
        barbero_id: barberos[0]?.id ?? '',
        fecha_inicio: fechaMin,
        fecha_fin: fechaMin,
        motivo: '',
        visible_clientes: true,
    });

    const actualizarDia = (index, campo, valor) => {
        setData(
            'horarios',
            data.horarios.map((item, i) =>
                i === index ? { ...item, [campo]: valor } : item
            )
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(HorarioController.actualizar.url(), {
            preserveScroll: true,
        });
    };

    const handleCrearAusencia = (e) => {
        e.preventDefault();
        ausenciaForm.post(HorarioController.crearAusencia.url(), {
            preserveScroll: true,
            onSuccess: () => {
                ausenciaForm.setData({
                    barbero_id: ausenciaForm.data.barbero_id || barberos[0]?.id || '',
                    fecha_inicio: fechaMin,
                    fecha_fin: fechaMin,
                    motivo: '',
                    visible_clientes: true,
                });
            },
        });
    };

    const handleEliminarAusencia = async (ausencia) => {
        const res = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar esta ausencia?',
            text: `${ausencia.barbero_nombre} volverá a aparecer disponible en esas fechas.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#1f1b17',
            color: '#f5efe6',
            confirmButtonColor: '#b83232',
            cancelButtonColor: '#3a332c',
        });

        if (res.isConfirmed) {
            router.delete(HorarioController.eliminarAusencia.url(ausencia.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Horarios Laborales" />

            <h1 className="nombre-pagina">Horarios Laborales</h1>
            <p className="descripcion-pagina">
                Define qué días abre la barbería, horarios de atención e intervalo entre citas
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="horarios-config-form">
                <div className="horarios-dias-list">
                    {data.horarios.map((dia, index) => (
                        <div
                            key={dia.dia_semana}
                            className={`horario-dia-card ${!dia.abierto ? 'cerrado' : ''}`}
                        >
                            <div className="horario-dia-top">
                                <strong className="horario-dia-nombre">{dia.nombre_dia}</strong>
                                <label className="horario-switch">
                                    <input
                                        type="checkbox"
                                        checked={dia.abierto}
                                        onChange={(e) =>
                                            actualizarDia(index, 'abierto', e.target.checked)
                                        }
                                    />
                                    <span>{dia.abierto ? 'Abierto' : 'Cerrado'}</span>
                                </label>
                            </div>

                            {dia.abierto && (
                                <div className="horario-dia-campos">
                                    <div className="agenda-campo">
                                        <label htmlFor={`apertura-${dia.dia_semana}`}>Apertura</label>
                                        <input
                                            id={`apertura-${dia.dia_semana}`}
                                            type="time"
                                            value={dia.hora_apertura}
                                            onChange={(e) =>
                                                actualizarDia(index, 'hora_apertura', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="agenda-campo">
                                        <label htmlFor={`cierre-${dia.dia_semana}`}>Cierre</label>
                                        <input
                                            id={`cierre-${dia.dia_semana}`}
                                            type="time"
                                            value={dia.hora_cierre}
                                            onChange={(e) =>
                                                actualizarDia(index, 'hora_cierre', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="agenda-campo">
                                        <label htmlFor={`intervalo-${dia.dia_semana}`}>Intervalo</label>
                                        <select
                                            id={`intervalo-${dia.dia_semana}`}
                                            value={dia.intervalo_minutos}
                                            onChange={(e) =>
                                                actualizarDia(
                                                    index,
                                                    'intervalo_minutos',
                                                    Number(e.target.value)
                                                )
                                            }
                                        >
                                            <option value={30}>Cada 30 min</option>
                                            <option value={45}>Cada 45 min</option>
                                            <option value={60}>Cada 60 min (1 hora)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    className="boton"
                    style={{ width: '100%' }}
                    disabled={processing}
                >
                    {processing ? 'Guardando horarios...' : 'Guardar Horarios Laborales'}
                </button>
            </form>

            {/* Spec 022: Ausencias, Vacaciones y Días Libres por Barbero */}
            <section
                className="horarios-ausencias-panel"
                style={{
                    marginTop: '3.6rem',
                    padding: '2.2rem',
                    borderRadius: '1.2rem',
                    border: '1px solid rgba(212, 162, 89, 0.25)',
                    background: 'rgba(255, 255, 255, 0.02)',
                }}
            >
                <h2 style={{ margin: '0 0 0.6rem', fontSize: '2.2rem' }}>
                    Ausencias, Vacaciones y Días Libres por Barbero
                </h2>
                <p
                    style={{
                        margin: '0 0 2rem',
                        color: 'rgba(245, 239, 230, 0.72)',
                        fontSize: '1.4rem',
                        lineHeight: 1.5,
                    }}
                >
                    Si el dueño o cualquier barbero tiene un compromiso, descanso o vacaciones,
                    regístralo aquí. La barbería seguirá operando con los demás barberos y los
                    clientes verán el aviso con antelación al iniciar sesión.
                </p>

                {barberos.length === 0 ? (
                    <p style={{ color: '#b9afa1', fontSize: '1.4rem' }}>
                        Aún no hay barberos registrados en esta barbería.
                    </p>
                ) : (
                    <form onSubmit={handleCrearAusencia} className="formulario" style={{ margin: 0 }}>
                        <div className="campo">
                            <label htmlFor="ausencia-barbero">Barbero</label>
                            <select
                                id="ausencia-barbero"
                                value={ausenciaForm.data.barbero_id}
                                onChange={(e) => ausenciaForm.setData('barbero_id', e.target.value)}
                                required
                            >
                                <option value="">-- Selecciona un barbero --</option>
                                {barberos.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.nombre_completo || `${b.nombre} ${b.apellido}`}
                                        {!b.activo ? ' (Inactivo)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
                                gap: '1.4rem',
                            }}
                        >
                            <div className="campo" style={{ marginBottom: 0 }}>
                                <label htmlFor="ausencia-inicio">Desde (Fecha inicio)</label>
                                <input
                                    id="ausencia-inicio"
                                    type="date"
                                    min={fechaMin}
                                    value={ausenciaForm.data.fecha_inicio}
                                    onChange={(e) => {
                                        const nuevaInicio = e.target.value;
                                        ausenciaForm.setData((prev) => ({
                                            ...prev,
                                            fecha_inicio: nuevaInicio,
                                            fecha_fin:
                                                !prev.fecha_fin || prev.fecha_fin < nuevaInicio
                                                    ? nuevaInicio
                                                    : prev.fecha_fin,
                                        }));
                                    }}
                                    required
                                />
                            </div>

                            <div className="campo" style={{ marginBottom: 0 }}>
                                <label htmlFor="ausencia-fin">Hasta (Fecha fin)</label>
                                <input
                                    id="ausencia-fin"
                                    type="date"
                                    min={ausenciaForm.data.fecha_inicio || fechaMin}
                                    value={ausenciaForm.data.fecha_fin}
                                    onChange={(e) => ausenciaForm.setData('fecha_fin', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="campo" style={{ marginTop: '1.6rem' }}>
                            <label htmlFor="ausencia-motivo">Motivo (opcional, visible para clientes)</label>
                            <input
                                id="ausencia-motivo"
                                type="text"
                                maxLength={140}
                                placeholder="Ej. Vacaciones, compromiso personal, día libre..."
                                value={ausenciaForm.data.motivo}
                                onChange={(e) => ausenciaForm.setData('motivo', e.target.value)}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.7rem',
                                marginBottom: '1.6rem',
                            }}
                        >
                            {MOTIVOS_RAPIDOS.map((chip) => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => ausenciaForm.setData('motivo', chip)}
                                    style={{
                                        padding: '0.45rem 1.1rem',
                                        borderRadius: '999px',
                                        border:
                                            ausenciaForm.data.motivo === chip
                                                ? '1px solid #d4a259'
                                                : '1px solid rgba(255,255,255,0.18)',
                                        background:
                                            ausenciaForm.data.motivo === chip
                                                ? 'rgba(212, 162, 89, 0.2)'
                                                : 'rgba(255,255,255,0.04)',
                                        color: '#f5efe6',
                                        fontSize: '1.25rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '2rem',
                                fontSize: '1.4rem',
                                color: '#e8dfd2',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={ausenciaForm.data.visible_clientes}
                                onChange={(e) =>
                                    ausenciaForm.setData('visible_clientes', e.target.checked)
                                }
                                style={{ width: '1.8rem', height: '1.8rem', accentColor: '#d4a259' }}
                            />
                            <span>
                                Mostrar aviso anticipado a los clientes cuando inicien sesión en{' '}
                                <strong>Agendar Cita</strong>
                            </span>
                        </label>

                        <button
                            type="submit"
                            className="boton"
                            style={{ width: '100%' }}
                            disabled={ausenciaForm.processing}
                        >
                            {ausenciaForm.processing
                                ? 'Registrando ausencia...'
                                : 'Registrar Ausencia / Bloquear Fechas'}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2.6rem' }}>
                    <h3 style={{ margin: '0 0 1.2rem', fontSize: '1.7rem' }}>
                        Ausencias Próximas Programadas ({ausencias.length})
                    </h3>

                    {ausencias.length === 0 ? (
                        <p
                            style={{
                                margin: 0,
                                padding: '1.4rem',
                                borderRadius: '0.9rem',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'rgba(245, 239, 230, 0.65)',
                                fontSize: '1.35rem',
                            }}
                        >
                            No hay ausencias ni vacaciones programadas. Todos los barberos activos
                            están disponibles en el horario laboral normal.
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {ausencias.map((a) => {
                                const mismoDia = a.fecha_inicio === a.fecha_fin;
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1.2rem',
                                            padding: '1.4rem 1.6rem',
                                            borderRadius: '1rem',
                                            border: '1px solid rgba(212, 162, 89, 0.24)',
                                            background: 'rgba(20, 17, 14, 0.65)',
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    gap: '0.8rem',
                                                    marginBottom: '0.4rem',
                                                }}
                                            >
                                                <strong style={{ fontSize: '1.55rem', color: '#f5efe6' }}>
                                                    {a.barbero_nombre}
                                                </strong>
                                                <span
                                                    style={{
                                                        padding: '0.2rem 0.8rem',
                                                        borderRadius: '999px',
                                                        fontSize: '1.15rem',
                                                        fontWeight: 700,
                                                        background: a.visible_clientes
                                                            ? 'rgba(212, 162, 89, 0.2)'
                                                            : 'rgba(255, 255, 255, 0.1)',
                                                        color: a.visible_clientes ? '#f0c674' : '#c5bdb0',
                                                    }}
                                                >
                                                    {a.visible_clientes
                                                        ? 'Visible a clientes'
                                                        : 'Solo bloqueo interno'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '1.35rem', color: '#e0d6c8' }}>
                                                {mismoDia
                                                    ? formatearFechaCorta(a.fecha_inicio)
                                                    : `Del ${formatearFechaCorta(a.fecha_inicio)} al ${formatearFechaCorta(a.fecha_fin)}`}
                                            </div>
                                            {a.motivo && (
                                                <div
                                                    style={{
                                                        marginTop: '0.3rem',
                                                        fontSize: '1.28rem',
                                                        color: '#b9afa1',
                                                    }}
                                                >
                                                    Motivo: {a.motivo}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className="boton-eliminar"
                                            style={{ margin: 0, padding: '0.8rem 1.4rem', fontSize: '1.3rem' }}
                                            onClick={() => handleEliminarAusencia(a)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
