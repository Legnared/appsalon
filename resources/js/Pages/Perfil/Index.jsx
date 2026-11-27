import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import PasswordInput from '@/Components/PasswordInput';
import PerfilController from '@/actions/App/Http/Controllers/PerfilController';

export default function PerfilIndex({ perfil }) {
    const [previewFoto, setPreviewFoto] = useState(perfil?.foto_url || null);

    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: perfil?.nombre ?? '',
        apellido: perfil?.apellido ?? '',
        telefono: perfil?.telefono ?? '',
        especialidad: perfil?.especialidad ?? '',
        email: perfil?.email ?? '',
        foto: null,
        eliminar_foto: false,
        password_actual: '',
        password_nuevo: '',
        password_nuevo_confirmation: '',
    });

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('foto', file);
        setData('eliminar_foto', false);
        if (file) {
            setPreviewFoto(URL.createObjectURL(file));
        }
    };

    const quitarFoto = () => {
        setData('foto', null);
        setData('eliminar_foto', true);
        setPreviewFoto(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(PerfilController.actualizar.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset('password_actual', 'password_nuevo', 'password_nuevo_confirmation'),
        });
    };

    return (
        <>
            <Head title="Mi Perfil y Contraseña" />

            <h1 className="nombre-pagina">Mi Perfil</h1>
            <p className="descripcion-pagina">
                Actualiza tus datos personales, fotografía y contraseña de acceso
            </p>

            <Alertas errors={errors} />

            <form className="formulario superadmin-form" onSubmit={handleSubmit}>
                <section className="superadmin-section">
                    <h3>1. Datos Personales</h3>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="p_nombre">Nombre(s)</label>
                            <input
                                id="p_nombre"
                                type="text"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="p_apellido">Apellido(s)</label>
                            <input
                                id="p_apellido"
                                type="text"
                                value={data.apellido}
                                onChange={(e) => setData('apellido', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="p_telefono">Teléfono (con LADA)</label>
                            <input
                                id="p_telefono"
                                type="text"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="p_email">Correo de Acceso</label>
                            <input
                                id="p_email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </div>

                        {perfil?.es_barbero && (
                            <div className="campo" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="p_especialidad">Especialidad / Bio corta</label>
                                <input
                                    id="p_especialidad"
                                    type="text"
                                    value={data.especialidad}
                                    onChange={(e) => setData('especialidad', e.target.value)}
                                    placeholder="Ej. Master Barber · Fade, Corte Clásico y Barba"
                                />
                            </div>
                        )}

                        <div className="marca-upload-card" style={{ gridColumn: '1 / -1' }}>
                            <span className="marca-upload-label">Fotografía de Perfil</span>
                            <div className="marca-logo-preview-wrap">
                                {previewFoto ? (
                                    <img src={previewFoto} alt="Mi foto" className="marca-logo-preview" />
                                ) : (
                                    <div
                                        className="marca-logo-preview"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', fontWeight: 700 }}
                                    >
                                        {(data.nombre || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="marca-upload-actions">
                                    <label className="boton marca-file-btn">
                                        {previewFoto ? 'Cambiar Fotografía' : 'Subir Fotografía'}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleFotoChange}
                                            hidden
                                        />
                                    </label>
                                    {previewFoto && (
                                        <button type="button" className="boton boton-secundario" onClick={quitarFoto}>
                                            Quitar foto
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="superadmin-section">
                    <h3>2. Seguridad y Contraseña</h3>
                    <p className="superadmin-hint">
                        Escribe tu nueva contraseña y confírmala para actualizarla. Si solo editas tus datos, deja estos campos vacíos.
                    </p>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="p_pass_nuevo">Nueva Contraseña (mín. 6 caracteres)</label>
                            <PasswordInput
                                id="p_pass_nuevo"
                                value={data.password_nuevo}
                                onChange={(e) => setData('password_nuevo', e.target.value)}
                                placeholder="Dejar vacío para conservar la actual"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="p_pass_confirm">Repetir Nueva Contraseña</label>
                            <PasswordInput
                                id="p_pass_confirm"
                                value={data.password_nuevo_confirmation}
                                onChange={(e) => setData('password_nuevo_confirmation', e.target.value)}
                                placeholder="Repite tu nueva contraseña"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                </section>

                <div className="superadmin-submit-row">
                    <button type="submit" className="boton" disabled={processing}>
                        {processing ? 'Guardando...' : 'Guardar Mi Perfil'}
                    </button>
                </div>
            </form>
        </>
    );
}
