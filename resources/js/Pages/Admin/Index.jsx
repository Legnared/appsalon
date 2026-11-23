import { Head, router } from '@inertiajs/react';
import Barra from '@/Components/Barra';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import APIController from '@/actions/App/Http/Controllers/APIController';

export default function AdminIndex({ citas = [], fecha = '' }) {
    const handleFechaChange = (e) => {
        const fechaSeleccionada = e.target.value;
        if (!fechaSeleccionada) return;

        router.get(
            AdminController.index.url({ query: { fecha: fechaSeleccionada } }),
            {},
            { preserveState: true, replace: true }
        );
    };

    const handleEliminar = (e, id) => {
        e.preventDefault();
        router.post(APIController.eliminar.url(), { id });
    };

    return (
        <>
            <Head title="Panel de Administración" />

            <h1 className="nombre-pagina">Panel de Administración</h1>

            <Barra />

            <h2>Buscar Citas</h2>
            <div className="busqueda">
                <form className="formulario" onSubmit={(e) => e.preventDefault()}>
                    <div className="campo">
                        <label htmlFor="fecha">Fecha</label>
                        <input
                            type="date"
                            id="fecha"
                            name="fecha"
                            value={fecha}
                            onChange={handleFechaChange}
                        />
                    </div>
                </form>
            </div>

            {citas.length === 0 && <h2>No Hay Citas en esta fecha</h2>}

            <div id="citas-admin">
                <ul className="citas">
                    {citas.map((cita) => (
                        <li key={cita.id}>
                            <p>
                                ID: <span>{cita.id}</span>
                            </p>
                            <p>
                                Hora: <span>{cita.hora}</span>
                            </p>
                            <p>
                                Cliente: <span>{cita.cliente}</span>
                            </p>
                            <p>
                                Email: <span>{cita.email}</span>
                            </p>
                            <p>
                                Teléfono: <span>{cita.telefono}</span>
                            </p>

                            <h3>Servicios</h3>
                            {cita.servicios.map((servicio) => (
                                <p key={`${cita.id}-${servicio.id}`} className="servicio">
                                    {servicio.nombre} {servicio.precio}
                                </p>
                            ))}

                            <p className="total">
                                Total: <span>$ {cita.total}</span>
                            </p>

                            <form onSubmit={(e) => handleEliminar(e, cita.id)}>
                                <input type="hidden" name="id" value={cita.id} />
                                <input
                                    type="submit"
                                    className="boton-eliminar"
                                    value="Eliminar"
                                />
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
