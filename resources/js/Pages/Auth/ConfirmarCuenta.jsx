import { Head, Link } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function ConfirmarCuenta({ alertas = {} }) {
    return (
        <>
            <Head title="Confirmar Cuenta" />

            <h1 className="nombre-pagina">Confirmar Cuenta</h1>

            <Alertas alertas={alertas} />

            <div className="acciones">
                <Link href={AuthController.showLogin.url()}>Iniciar Sesión</Link>
            </div>

            <div className="acciones">
                <Link href={AuthController.showLogin.url()}>
                    ¿Ya tienes una cuenta? Inicia Sesión
                </Link>
            </div>
        </>
    );
}
