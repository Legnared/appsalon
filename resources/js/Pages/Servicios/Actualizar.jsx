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
        duracion_minutos: servicio?.duracion_minutos ?? 30,
        descripcion: servicio?.descripcion ?? '',
        activo: servicio?.activo ?? true,
        imagen: null,
        eliminar_imagen: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ServicioController.actualizar.url({ query: { id: servicio.id } }), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Editar Servicio" />

            <h1 className="nombre-pagina">Editar Servicio</h1>
            <p className="descripcion-pagina">
                Modifica los detalles, descripción o fotografía del servicio
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ServicioFormulario
                    data={data}
                    setData={setData}
                    imagenActualUrl={servicio?.imagen_url ?? null}
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
