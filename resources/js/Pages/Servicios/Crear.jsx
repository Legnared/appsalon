import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import ServicioFormulario from '@/Components/ServicioFormulario';
import ServicioController from '@/actions/App/Http/Controllers/ServicioController';

export default function ServiciosCrear({ tipoInicial = 'servicio' }) {
    const { data, setData, post, processing } = useForm({
        tipo: tipoInicial === 'producto' ? 'producto' : 'servicio',
        nombre: '',
        precio: '',
        duracion_minutos: 30,
        stock: '',
        descripcion: '',
        activo: true,
        tipos_rostro: [],
        recomendacion_rostro: '',
        imagen: null,
        eliminar_imagen: false,
    });

    const esProducto = data.tipo === 'producto';

    const handleSubmit = (e) => {
        e.preventDefault();
        post(ServicioController.crear.url(), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title={esProducto ? 'Nuevo Producto' : 'Nuevo Servicio'} />

            <h1 className="nombre-pagina">
                {esProducto ? 'Nuevo Producto de Barbería' : 'Nuevo Servicio'}
            </h1>
            <p className="descripcion-pagina">
                {esProducto
                    ? 'Añade pomadas, ceras, aceites o productos de cuidado masculino con foto y precio'
                    : 'Añade nombre, precio, descripción y foto de referencia del servicio'}
            </p>

            <Barra />
            <Alertas />

            <form onSubmit={handleSubmit} className="formulario" noValidate>
                <ServicioFormulario data={data} setData={setData} />
                <input
                    type="submit"
                    className="boton"
                    value={
                        processing
                            ? 'Guardando...'
                            : esProducto
                              ? 'Guardar Producto'
                              : 'Guardar Servicio'
                    }
                    disabled={processing}
                />
            </form>
        </>
    );
}
