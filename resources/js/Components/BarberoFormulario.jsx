import { useEffect, useState } from 'react';

export default function BarberoFormulario({
    data,
    setData,
    fotoActualUrl = null,
    esEdicion = false,
}) {
    const [previewUrl, setPreviewUrl] = useState(fotoActualUrl);

    useEffect(() => {
        if (data.foto instanceof File) {
            const url = URL.createObjectURL(data.foto);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        if (data.eliminar_foto) {
            setPreviewUrl(null);
        } else {
            setPreviewUrl(fotoActualUrl);
        }
    }, [data.foto, data.eliminar_foto, fotoActualUrl]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setData((prev) => ({
                ...prev,
                foto: file,
                eliminar_foto: false,
            }));
        }
    };

    const handleQuitarFoto = () => {
        setData((prev) => ({
            ...prev,
            foto: null,
            eliminar_foto: true,
        }));
    };

    return (
        <>
            <div className="campo">
                <label htmlFor="nombre">Nombre(s)</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre del barbero"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="apellido">Apellido(s)</label>
                <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    placeholder="Apellido del barbero"
                    value={data.apellido}
                    onChange={(e) => setData('apellido', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="especialidad">Especialidad</label>
                <input
                    type="text"
                    id="especialidad"
                    name="especialidad"
                    placeholder="Ej. Fade, Barba con Navaja, Corte Clásico"
                    value={data.especialidad}
                    onChange={(e) => setData('especialidad', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="telefono">Teléfono</label>
                <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    maxLength={10}
                    placeholder="10 dígitos"
                    value={data.telefono}
                    onChange={(e) => setData('telefono', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="correo@barberia.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="password">
                    {esEdicion ? 'Nuevo Password' : 'Password'}
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder={
                        esEdicion
                            ? 'Déjalo vacío para conservar el actual'
                            : 'Mínimo 6 caracteres'
                    }
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                />
            </div>

            <div className="campo campo-columna">
                <label htmlFor="foto">Fotografía del barbero</label>
                <div className="upload-foto-box">
                    {previewUrl ? (
                        <div className="upload-preview">
                            <img src={previewUrl} alt="Vista previa del barbero" />
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

                    <label htmlFor="foto" className="btn-subir-foto">
                        {previewUrl ? 'Cambiar fotografía' : 'Seleccionar fotografía'}
                    </label>
                    <input
                        type="file"
                        id="foto"
                        name="foto"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="input-file-oculto"
                    />
                </div>
            </div>

            <div className="campo campo-switch">
                <label htmlFor="activo" className="switch-label">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={Boolean(data.activo)}
                        onChange={(e) => setData('activo', e.target.checked)}
                    />
                    <span>Barbero activo y disponible en la barbería</span>
                </label>
            </div>
        </>
    );
}
