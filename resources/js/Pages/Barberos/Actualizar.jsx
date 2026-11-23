import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import BarberoFormulario from '@/Components/BarberoFormulario';
import BarberoController from '@/actions/App/Http/Controllers/BarberoController';

export default function BarberosActualizar({ barbero }) {
    const { data, setData, post, processing } = useForm({
        id: barbero?.id ?? '',
        nombre: barbero?.nombre ?? '',
        apellido: barbero?.apellido ?? '',
        especialidad: barbero?.especialidad ?? '',
        telefono: barbero?.telefono ?? '',
        email: barbero?.email ?? '',
        password: '',
        activo: barbero?.activo ?? true,
        foto: null,
        eliminar_foto: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(BarberoController.actualizar.url({ query: { id: barbero.id } }), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Editar Barbero" />

            <h1 className="nombre-pagina">Editar Barbero</h1>
            <p className="descripcion-pagina">
                Actualiza los datos, especialidad o fotografía del barbero
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <BarberoFormulario
                    data={data}
                    setData={setData}
                    fotoActualUrl={barbero?.foto_url ?? null}
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
