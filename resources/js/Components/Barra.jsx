import { Link, usePage } from '@inertiajs/react';
import AdminController from '@/actions/App/Http/Controllers/AdminController';
import AuthController from '@/actions/App/Http/Controllers/AuthController';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function Barra() {
    const { auth } = usePage().props;
    const usuario = auth?.user;

    return (
        <>
            <div className="barra">
                <p>Hola: {usuario?.nombreCompleto ?? ''}</p>
                <Link
                    className="boton-cerrar-sesion"
                    href={AuthController.logout.url()}
                    method="post"
                    as="button"
                    type="button"
                >
                    Cerrar Sesión
                </Link>
            </div>

            {usuario?.admin && (
                <div className="barra-servicios">
                    <Link className="boton" href={AdminController.index.url()}>
                        Ver Citas
                    </Link>
                    <Link className="boton" href={ServicioController.index.url()}>
                        Ver Servicios
                    </Link>
                    <Link className="boton" href={ServicioController.showCrear.url()}>
                        Nuevo Servicio
                    </Link>
                </div>
            )}
        </>
    );
}
