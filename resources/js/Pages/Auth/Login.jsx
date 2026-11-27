import { Head, Link, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import PasswordInput from '@/Components/PasswordInput';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function Login() {
    const { data, setData, post, processing } = useForm({
        email: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(AuthController.login.url());
    };

    return (
        <>
            <Head title="Login" />

            <h1 className="nombre-pagina">Login</h1>
            <p className="descripcion-pagina">Inicia sesión con tus datos</p>

            <Alertas />

            <form className="formulario" onSubmit={handleSubmit} noValidate>
                <div className="campo">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Tu Email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="password">Password</label>
                    <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Tu Password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Iniciando...' : 'Iniciar Sesión'}
                    disabled={processing}
                />
            </form>

            <div className="acciones">
                <Link href={AuthController.showCrear.url()}>
                    ¿Aún no tienes una cuenta? Crear una
                </Link>
                <Link href={AuthController.showOlvide.url()}>
                    ¿Olvidaste tú Contraseña?
                </Link>
            </div>
        </>
    );
}
