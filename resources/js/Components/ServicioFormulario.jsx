export default function ServicioFormulario({ data, setData }) {
    return (
        <>
            <div className="campo">
                <label htmlFor="nombre">Nombre</label>
                <input
                    type="text"
                    id="nombre"
                    placeholder="Nombre Servicio"
                    name="nombre"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="precio">Precio</label>
                <input
                    type="number"
                    id="precio"
                    placeholder="Precio Servicio"
                    name="precio"
                    value={data.precio}
                    onChange={(e) => setData('precio', e.target.value)}
                />
            </div>
        </>
    );
}
