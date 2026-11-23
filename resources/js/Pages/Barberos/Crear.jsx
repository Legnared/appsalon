import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import BarberoFormulario from '@/Components/BarberoFormulario';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';

export default function BarberosCrear() {
    const { data, setData, post, processing } = useForm({
        nombre: '',
        apellido: '',
        especialidad: '',
        telefono: '',
        email: '',
        password: '',
        activo: true,
        foto: null,
        eliminar_foto: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(BarberoController.crear.url(), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Nuevo Barbero" />

            <h1 className="nombre-pagina">Registrar Barbero</h1>
            <p className="descripcion-pagina">
                Da de alta a un nuevo barbero con su especialidad, foto y acceso
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <BarberoFormulario data={data} setData={setData} />
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Registrando...' : 'Guardar Barbero'}
                    disabled={processing}
                />
            </form>
        </>
    );
}
