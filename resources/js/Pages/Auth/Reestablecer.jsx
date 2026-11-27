import { Head, Link, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import PasswordInput from '@/Components/PasswordInput';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function Reestablecer({ alertas = {}, error = false, token = '' }) {
    const { data, setData, post, processing } = useForm({
        password: '',
        token,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(AuthController.recuperar.url({ query: { token } }));
    };

    return (
        <>
            <Head title="Recuperar Password" />

            <h1 className="nombre-pagina">Recuperar Password</h1>
            <p className="descripcion-pagina">Coloca tu nuevo password a continuación</p>

            <Alertas alertas={alertas} />

            {!error && (
                <>
                    <form className="formulario" onSubmit={handleSubmit} noValidate>
                        <div className="campo">
                            <label htmlFor="password">Password</label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Tu Nuevo Password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                        <input
                            type="submit"
                            className="boton"
                            value={processing ? 'Guardando...' : 'Guardar Nuevo Password'}
                            disabled={processing}
                        />
                    </form>

                    <div className="acciones">
                        <Link href={AuthController.showLogin.url()}>
                            ¿Ya tienes cuenta? Iniciar Sesión
                        </Link>
                        <Link href={AuthController.showCrear.url()}>
                            ¿Aún no tienes cuenta? Obtener una
                        </Link>
                    </div>
                </>
            )}
        </>
    );
}
