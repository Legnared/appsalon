import { Head, Link, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function OlvidePassword() {
    const { data, setData, post, processing } = useForm({
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(AuthController.olvide.url());
    };

    return (
        <>
            <Head title="Olvide Contraseña" />

            <h1 className="nombre-pagina">Olvide Contraseña</h1>
            <p className="descripcion-pagina">
                Restablece tú contraseña escribiendo tú E-mail a continuación
            </p>

            <Alertas />

            <form className="formulario" onSubmit={handleSubmit} noValidate>
                <div className="campo">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Tu E-mail"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </div>
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Enviando...' : 'Enviar Instrucciones'}
                    disabled={processing}
                />
            </form>

            <div className="acciones">
                <Link href={AuthController.showLogin.url()}>
                    ¿Ya tienes una cuenta? Inicia Sesión
                </Link>
                <Link href={AuthController.showCrear.url()}>
                    ¿Aún no tienes cuenta? Crea una
                </Link>
            </div>
        </>
    );
}
