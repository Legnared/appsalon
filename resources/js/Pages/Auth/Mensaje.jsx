import { useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function Mensaje() {
    useEffect(() => {
        let activo = true;
        Swal.fire({
            icon: 'success',
            title: '¡Cuenta creada con éxito!',
            text: 'Hemos enviado las instrucciones para confirmar tu cuenta a tu e-mail. Revisa tu bandeja de entrada para activarla.',
            confirmButtonText: 'Ir a Iniciar Sesión',
            showCancelButton: true,
            cancelButtonText: 'Permanecer aquí',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        }).then((result) => {
            if (activo && result.isConfirmed) {
                router.visit(AuthController.showLogin.url());
            }
        });

        return () => {
            activo = false;
        };
    }, []);

    return (
        <>
            <Head title="Confirma tu cuenta" />

            <h1 className="nombre-pagina">Confirma tu cuenta</h1>
            <p className="descripcion-pagina">
                Hemos enviado las instrucciones para confirmar tu cuenta a tu e-mail.
            </p>

            <div className="formulario" style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 1.8rem', color: '#e4ddd2', fontSize: '1.55rem' }}>
                    Abre el correo de <strong>Danny&apos;s BarberShop</strong> y presiona el botón de confirmación para activar tu acceso.
                </p>
                <Link
                    href={AuthController.showLogin.url()}
                    className="boton"
                    style={{ margin: 0, width: '100%' }}
                >
                    Ir a Iniciar Sesión
                </Link>
            </div>
        </>
    );
}
