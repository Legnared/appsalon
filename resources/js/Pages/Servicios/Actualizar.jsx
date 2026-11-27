import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioFormulario from '@/Components/ServicioFormulario';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosActualizar({ servicio }) {
    const { data, setData, post, processing } = useForm({
        id: servicio?.id ?? '',
        tipo: servicio?.tipo || 'servicio',
        nombre: servicio?.nombre ?? '',
        precio: servicio?.precio ?? '',
        duracion_minutos: servicio?.duracion_minutos ?? 30,
        stock: servicio?.stock ?? '',
        descripcion: servicio?.descripcion ?? '',
        activo: servicio?.activo ?? true,
        tipos_rostro: Array.isArray(servicio?.tipos_rostro) ? servicio.tipos_rostro : [],
        recomendacion_rostro: servicio?.recomendacion_rostro ?? '',
        imagen: null,
        eliminar_imagen: false,
    });

    const esProducto = data.tipo === 'producto';

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ServicioController.actualizar.url({ query: { id: servicio.id } }), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title={esProducto ? 'Editar Producto' : 'Editar Servicio'} />

            <h1 className="nombre-pagina">
                {esProducto ? 'Editar Producto' : 'Editar Servicio'}
            </h1>
            <p className="descripcion-pagina">
                Modifica los detalles, precio, descripción o fotografía del catálogo
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
