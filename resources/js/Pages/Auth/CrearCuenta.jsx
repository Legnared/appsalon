import { Head, Link, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import AuthController from '@/actions/App/Http/Controllers/AuthController';

export default function CrearCuenta() {
    const { data, setData, post, processing } = useForm({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(AuthController.crear.url());
    };

    return (
        <>
            <Head title="Crear Cuenta" />

            <h1 className="nombre-pagina">Crear Cuenta</h1>
            <p className="descripcion-pagina">Llena el siguiente formulario de Registro</p>

            <Alertas />

            <form className="formulario" onSubmit={handleSubmit} noValidate>
                <div className="campo">
                    <label htmlFor="nombre">Nombre(s)</label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        placeholder="Tú nombre"
                        value={data.nombre}
                        onChange={(e) => setData('nombre', e.target.value)}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="apellido">Apellido(s)</label>
                    <input
                        type="text"
                        id="apellido"
                        name="apellido"
                        placeholder="Tú apellido"
                        value={data.apellido}
                        onChange={(e) => setData('apellido', e.target.value)}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        placeholder="Tú Teléfono"
                        value={data.telefono}
                        onChange={(e) => setData('telefono', e.target.value)}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Tu E-mail"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Tu Password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </div>
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Creando Cuenta...' : 'Crear Cuenta'}
                    disabled={processing}
                />
            </form>

            <div className="acciones">
                <Link href={AuthController.showLogin.url()}>
                    ¿Ya tienes una cuenta? Inicia Sesión
                </Link>
                <Link href={AuthController.showOlvide.url()}>
                    ¿Olvidaste tú Contraseña?
                </Link>
            </div>
        </>
    );
}
