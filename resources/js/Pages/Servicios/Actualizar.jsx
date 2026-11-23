import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioFormulario from '@/Components/ServicioFormulario';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosActualizar({ servicio }) {
    const { data, setData, post, processing } = useForm({
        id: servicio?.id ?? '',
        nombre: servicio?.nombre ?? '',
        precio: servicio?.precio ?? '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ServicioController.actualizar.url({ query: { id: servicio.id } }));
    };

    return (
        <>
            <Head title="Actualizar Servicio" />

            <h1 className="nombre-pagina">Actualizar Servicio</h1>
            <p className="descripcion-pagina">Modifica los valores del formulario</p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ServicioFormulario data={data} setData={setData} />
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Actualizando...' : 'Actualizar'}
                    disabled={processing}
                />
            </form>
        </>
    );
}
