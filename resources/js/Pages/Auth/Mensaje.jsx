import { Head, Link } from '@inertiajs/react';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function Mensaje() {
    return (
        <>
            <Head title="Confirma tu cuenta" />

            <h1 className="nombre-pagina">Confirma tu cuenta</h1>
            <p className="descripcion-pagina">
                Hemos enviado las instrucciones para confirmar tu cuenta a tu e-mail.
            </p>

            <div className="acciones">
                <Link href={AuthController.showLogin.url()}>Iniciar Sesión</Link>
            </div>
        </>
    );
}
