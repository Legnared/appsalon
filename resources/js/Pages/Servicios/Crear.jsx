import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioFormulario from '@/Components/ServicioFormulario';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosCrear() {
    const { data, setData, post, processing } = useForm({
        nombre: '',
        precio: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ServicioController.crear.url());
    };

    return (
        <>
            <Head title="Nuevo Servicio" />

            <h1 className="nombre-pagina">Nuevo Servicio</h1>
            <p className="descripcion-pagina">
                Llena todos los campos para añadir un nuevo servicio
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ServicioFormulario data={data} setData={setData} />
                <input
                    type="submit"
                    className="boton"
                    value={processing ? 'Guardando...' : 'Guardar Servicio'}
                    disabled={processing}
                />
            </form>
        </>
    );
}
