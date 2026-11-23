import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ClienteFormulario from '@/Components/ClienteFormulario';
import ClienteController from '@/actions/App/Http/Controllers/ClienteController';

export default function ClientesActualizar({ cliente, barberos = [] }) {
    const { data, setData, post, processing } = useForm({
        id: cliente?.id ?? '',
        nombre: cliente?.nombre ?? '',
        apellido: cliente?.apellido ?? '',
        telefono: cliente?.telefono ?? '',
        email: cliente?.email ?? '',
        barbero_id: cliente?.barbero_id ?? '',
        password: '',
        confirmado: cliente?.confirmado ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ClienteController.actualizar.url({ query: { id: cliente.id } }));
    };

    return (
        <>
            <Head title="Editar Cliente" />

            <h1 className="nombre-pagina">Editar Cliente</h1>
            <p className="descripcion-pagina">
                Actualiza los datos o reasigna el barbero del cliente
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ClienteFormulario
                    data={data}
                    setData={setData}
                    barberos={barberos}
                    esEdicion
                />
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Guardando cambios...' : 'Guardar Cambios'}
                    disabled={processing}
                />
            </form>
        </>
    );
}
