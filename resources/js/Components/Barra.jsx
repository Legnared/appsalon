import { Link, usePage } from '@inertiajs/react';

export default function Barra({
    logoutUrl = '/logout',
    adminUrl = '/admin',
    serviciosUrl = '/servicios',
    crearServicioUrl = '/servicios/crear',
}) {
    const { auth } = usePage().props;
    const usuario = auth?.user;

    return (
        <>
            <div className="barra">
                <p>Hola: {usuario?.nombreCompleto ?? ''}</p>
                <Link className="boton-cerrar-sesion" href={logoutUrl} method="post" as="button" type="button">
                    Cerrar Sesión
                </Link>
            </div>

            {usuario?.admin && (
                <div className="barra-servicios">
                    <Link className="boton" href={adminUrl}>
                        Ver Citas
                    </Link>
                    <Link className="boton" href={serviciosUrl}>
                        Ver Servicios
                    </Link>
                    <Link className="boton" href={crearServicioUrl}>
                        Nuevo Servicio
                    </Link>
                </div>
            )}
        </>
    );
}
