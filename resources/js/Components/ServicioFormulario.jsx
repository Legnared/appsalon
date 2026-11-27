import { useEffect, useState } from 'react';
import { TIPOS_ROSTRO } from '@/Components/GuiaTipoRostro';

export default function ServicioFormulario({ data, setData, imagenActualUrl = null }) {
    const [previewUrl, setPreviewUrl] = useState(imagenActualUrl);

    useEffect(() => {
        if (data.imagen instanceof File) {
            const url = URL.createObjectURL(data.imagen);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        if (data.eliminar_imagen) {
            setPreviewUrl(null);
        } else {
            setPreviewUrl(imagenActualUrl);
        }
    }, [data.imagen, data.eliminar_imagen, imagenActualUrl]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setData((prev) => ({
                ...prev,
                imagen: file,
                eliminar_imagen: false,
            }));
        }
    };

    const handleQuitarFoto = () => {
        setData((prev) => ({
            ...prev,
            imagen: null,
            eliminar_imagen: true,
        }));
    };

    const esProducto = (data.tipo || 'servicio') === 'producto';

    return (
        <>
            <div className="campo campo-columna">
                <label>Tipo de artículo</label>
                <div className="para-quien-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <button
                        type="button"
                        className={`para-quien-btn ${!esProducto ? 'activo' : ''}`}
                        onClick={() => setData('tipo', 'servicio')}
                    >
                        Servicio de Barbería
                    </button>
                    <button
                        type="button"
                        className={`para-quien-btn ${esProducto ? 'activo' : ''}`}
                        onClick={() => setData('tipo', 'producto')}
                    >
                        Producto de Cuidado
                    </button>
                </div>
            </div>

            <div className="campo">
                <label htmlFor="nombre">Nombre</label>
                <input
                    type="text"
                    id="nombre"
                    placeholder={
                        esProducto
                            ? 'Ej. Pomada Mate Fijación Fuerte 100g'
                            : 'Ej. Corte Fade + Perfilado de Barba'
                    }
                    name="nombre"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="precio">Precio ($)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="precio"
                    placeholder={esProducto ? 'Ej. 220.00' : 'Ej. 150.00'}
                    name="precio"
                    value={data.precio}
                    onChange={(e) => setData('precio', e.target.value)}
                />
            </div>

            {esProducto ? (
                <div className="campo">
                    <label htmlFor="stock">Stock disponible (opcional)</label>
                    <input
                        type="number"
                        min="0"
                        max="9999"
                        step="1"
                        id="stock"
                        placeholder="Dejar vacío si no controlas stock"
                        name="stock"
                        value={data.stock ?? ''}
                        onChange={(e) => setData('stock', e.target.value)}
                    />
                </div>
            ) : (
                <div className="campo">
                    <label htmlFor="duracion_minutos">Duración (min)</label>
                    <input
                        type="number"
                        min="5"
                        max="480"
                        step="5"
                        id="duracion_minutos"
                        placeholder="Ej. 30"
                        name="duracion_minutos"
                        value={data.duracion_minutos}
                        onChange={(e) => setData('duracion_minutos', e.target.value)}
                    />
                </div>
            )}

            <div className="campo campo-columna">
                <label htmlFor="descripcion">
                    {esProducto ? 'Descripción del producto' : 'Descripción del corte / servicio'}
                </label>
                <textarea
                    id="descripcion"
                    name="descripcion"
                    rows="3"
                    placeholder={
                        esProducto
                            ? 'Beneficios, aroma, contenido (ml/g), modo de uso o tipo de cabello/barba...'
                            : 'Describe qué incluye el servicio (ej. lavado, toalla caliente, perfilado con navaja, productos...)'
                    }
                    value={data.descripcion}
                    onChange={(e) => setData('descripcion', e.target.value)}
                />
            </div>

            <div className="campo campo-columna">
                <label htmlFor="imagen">
                    {esProducto ? 'Fotografía del producto' : 'Fotografía de referencia'}
                </label>
                <div className="upload-foto-box">
                    {previewUrl ? (
                        <div className="upload-preview">
                            <img
                                src={previewUrl}
                                alt={esProducto ? 'Vista previa del producto' : 'Vista previa del servicio'}
                            />
                            <button
                                type="button"
                                className="btn-quitar-foto"
                                onClick={handleQuitarFoto}
                            >
                                Quitar foto
                            </button>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            <span>Sin fotografía cargada (JPG, PNG o WEBP · Máx. 4 MB)</span>
                        </div>
                    )}

                    <label htmlFor="imagen" className="btn-subir-foto">
                        {previewUrl ? 'Cambiar fotografía' : 'Seleccionar fotografía'}
                    </label>
                    <input
                        type="file"
                        id="imagen"
                        name="imagen"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="input-file-oculto"
                    />
                </div>
            </div>

            {!esProducto && (
                <>
                    <div className="campo campo-columna">
                        <label>Tipos de rostro recomendados (Visagismo)</label>
                        <div className="rostro-chips-form">
                            {TIPOS_ROSTRO.map((tipo) => {
                                const lista = Array.isArray(data.tipos_rostro) ? data.tipos_rostro : [];
                                const marcado = lista.includes(tipo.id);
                                return (
                                    <button
                                        key={tipo.id}
                                        type="button"
                                        className={`rostro-chip-btn ${marcado ? 'activo' : ''}`}
                                        onClick={() => {
                                            const siguiente = marcado
                                                ? lista.filter((id) => id !== tipo.id)
                                                : [...lista, tipo.id];
                                            setData('tipos_rostro', siguiente);
                                        }}
                                    >
                                        {tipo.nombre}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="campo campo-columna">
                        <label htmlFor="recomendacion_rostro">
                            Nota de por qué favorece (opcional)
                        </label>
                        <input
                            type="text"
                            id="recomendacion_rostro"
                            name="recomendacion_rostro"
                            placeholder="Ej. Rebaja laterales y agrega altura arriba para estilizar rostros redondos"
                            value={data.recomendacion_rostro ?? ''}
                            onChange={(e) => setData('recomendacion_rostro', e.target.value)}
                        />
                    </div>
                </>
            )}

            <div className="campo campo-switch">
                <label htmlFor="activo" className="switch-label">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={Boolean(data.activo)}
                        onChange={(e) => setData('activo', e.target.checked)}
                    />
                    <span>
                        {esProducto
                            ? 'Producto activo y visible para clientes'
                            : 'Servicio activo y visible para clientes al agendar'}
                    </span>
                </label>
            </div>
        </>
    );
}
