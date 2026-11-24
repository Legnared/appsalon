import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import HorarioController from '@/actions/App/Http/Controllers/HorarioController';

export default function HorariosIndex({ horarios = [] }) {
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
        </>
    );
}
