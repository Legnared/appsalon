import { Head, Link, router } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosIndex({ servicios = [] }) {
    const handleEliminar = (e, id) => {
        e.preventDefault();
        router.post(ServicioController.eliminar.url(), { id });
    };

    return (
        <>
            <Head title="Servicios" />

            <h1 className="nombre-pagina">Servicios</h1>
            <p className="descripcion-pagina">Catálogo artesanal de cortes y tratamientos</p>

            <Barra />
            <Alertas />

            <ul className="servicios">
                {servicios.map((servicio) => (
                    <li key={servicio.id}>
                        <div className="servicio-card-top">
                            <p className="servicio-card-nombre">{servicio.nombre}</p>
                            <p className="servicio-card-precio">${servicio.precio}</p>
                        </div>

                        <div className="acciones">
                            <Link
                                className="boton"
                                href={ServicioController.showActualizar.url({
                                    query: { id: servicio.id },
                                })}
                            >
                                Actualizar
                            </Link>

                            <form onSubmit={(e) => handleEliminar(e, servicio.id)}>
                                <input type="hidden" name="id" value={servicio.id} />
                                <input
                                    type="submit"
                                    value="Borrar"
                                    className="boton-eliminar"
                                />
                            </form>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}
