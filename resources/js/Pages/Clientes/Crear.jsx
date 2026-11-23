import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ClienteFormulario from '@/Components/ClienteFormulario';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';

export default function ClientesCrear({ barberos = [] }) {
    const { data, setData, post, processing } = useForm({
        nombre: '',
        apellido: '',
        telefono: '',
        email: '',
        barbero_id: '',
        password: '',
        confirmado: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ClienteController.crear.url());
    };

    return (
        <>
            <Head title="Nuevo Cliente" />

            <h1 className="nombre-pagina">Nuevo Cliente / Prospecto</h1>
            <p className="descripcion-pagina">
                Registra un cliente y asígnale su barbero de cabecera
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ClienteFormulario data={data} setData={setData} barberos={barberos} />
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Guardando...' : 'Guardar Cliente'}
                    disabled={processing}
                />
            </form>
        </>
    );
}
