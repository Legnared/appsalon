import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Alertas from '@/Components/Alertas';
import Barra from '@/Components/Barra';
import MarcaController from '@/actions/App/Http/Controllers/MarcaController';

const COLORES_BARBERIA = [
    { nombre: 'Latón Clásico', hex: '#d4a259' },
    { nombre: 'Azul Barbería', hex: '#2f80ed' },
    { nombre: 'Azul Eléctrico', hex: '#0da6f3' },
    { nombre: 'Rojo Barber Pole', hex: '#d63b3b' },
    { nombre: 'Verde Esmeralda', hex: '#10b981' },
    { nombre: 'Cobre Vintage', hex: '#c87533' },
    { nombre: 'Acero Platino', hex: '#94a3b8' },
];

const PLANTILLAS_DISENO = [
    {
        id: 'rustico_editorial',
        nombre: '1. Rústico Editorial',
        desc: 'Estilo clásico de barbería en carbón, cuero y tipografía Playfair Display.',
        swatchBg: 'linear-gradient(135deg, #28221c, #141210)',
        swatchInk: '#d4a259',
        tag: 'Original',
    },
    {
        id: 'moderno_urbano',
        nombre: '2. Moderno Urbano',
        desc: 'Tipografía geométrica Poppins, tarjetas glass dark y bordes definidos.',
        swatchBg: 'linear-gradient(135deg, #1b2434, #0b1019)',
        swatchInk: '#60a5fa',
        tag: 'Glass Dark',
    },
    {
        id: 'boutique_claro',
        nombre: '3. Boutique Claro',
        desc: 'Fondo marfil/blanco luminoso y texto oscuro ideal para salones y estéticas.',
        swatchBg: 'linear-gradient(135deg, #ffffff, #efeae0)',
        swatchInk: '#18181b',
        tag: 'Light',
    },
];

export default function MarcaIndex({ marcaActual }) {
    const [previewLogo, setPreviewLogo] = useState(marcaActual?.logo_url || '/img/icono.png');
    const [previewHero, setPreviewHero] = useState(marcaActual?.hero_url || '/img/1.webp');

    const { data, setData, post, processing, errors } = useForm({
        nombre: marcaActual?.nombre ?? '',
        tagline: marcaActual?.tagline ?? '',
        color_primario: marcaActual?.color_primario ?? '#d4a259',
        tema_diseno: marcaActual?.tema_diseno ?? 'rustico_editorial',
        logo: null,
        hero_imagen: null,
        eliminar_logo: false,
        eliminar_hero: false,
    });

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('logo', file);
        setData('eliminar_logo', false);
        if (file) {
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const handleHeroChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setData('hero_imagen', file);
        setData('eliminar_hero', false);
        if (file) {
            setPreviewHero(URL.createObjectURL(file));
        }
    };

    const restaurarLogo = () => {
        setData('logo', null);
        setData('eliminar_logo', true);
        setPreviewLogo('/img/icono.png');
    };

    const restaurarHero = () => {
        setData('hero_imagen', null);
        setData('eliminar_hero', true);
        setPreviewHero('/img/1.webp');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(MarcaController.actualizar.url(), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Mi Marca y Logo" />

            <h1 className="nombre-pagina">Mi Marca y Logo</h1>
            <p className="descripcion-pagina">
                Personaliza el logo del menú lateral, portada móvil y color principal de tu barbería
            </p>

            <Barra />
            <Alertas errors={errors} />

            <form className="formulario superadmin-form" onSubmit={handleSubmit}>
                <section className="superadmin-section">
                    <h3>1. Logo y Portada de la Barbería</h3>

                    <div className="superadmin-grid-2">
                        <div className="marca-upload-card">
                            <span className="marca-upload-label">Logo del Sidebar y App Móvil</span>
                            <div className="marca-logo-preview-wrap">
                                <img
                                    src={previewLogo}
                                    alt="Vista previa de logo"
                                    className="marca-logo-preview"
                                />
                                <div className="marca-upload-actions">
                                    <label className="boton marca-file-btn">
                                        Subir Logo (PNG/JPG/WEBP)
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleLogoChange}
                                            hidden
                                        />
                                    </label>
                                    {marcaActual?.tiene_logo_custom && (
                                        <button
                                            type="button"
                                            className="boton boton-secundario"
                                            onClick={restaurarLogo}
                                        >
                                            Usar ícono por defecto
                                        </button>
                                    )}
                                    <small>Recomendado: cuadrado 512×512 px (máx. 2 MB)</small>
                                </div>
                            </div>
                        </div>

                        <div className="marca-upload-card">
                            <span className="marca-upload-label">Fondo del Sidebar y Portada Login</span>
                            <div className="marca-hero-preview-wrap">
                                <img
                                    src={previewHero}
                                    alt="Vista previa de portada"
                                    className="marca-hero-preview"
                                />
                                <div className="marca-upload-actions">
                                    <label className="boton marca-file-btn">
                                        Cambiar Portada
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleHeroChange}
                                            hidden
                                        />
                                    </label>
                                    {marcaActual?.tiene_hero_custom && (
                                        <button
                                            type="button"
                                            className="boton boton-secundario"
                                            onClick={restaurarHero}
                                        >
                                            Restaurar foto original
                                        </button>
                                    )}
                                    <small>Foto vertical o cuadrada de tu local (máx. 4 MB)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="superadmin-section">
                    <h3>2. Nombre, Eslogan y Color Principal</h3>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="nombre">Nombre Visible de la Barbería</label>
                            <input
                                id="nombre"
                                type="text"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="tagline">Eslogan / Subtítulo</label>
                            <input
                                id="tagline"
                                type="text"
                                value={data.tagline}
                                onChange={(e) => setData('tagline', e.target.value)}
                                placeholder="Corte Clásico · Barba · Estilo"
                            />
                        </div>

                        <div className="campo" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="color_primario">Color del Tema (Paleta Barbería)</label>
                            <div className="color-picker-row">
                                <input
                                    id="color_primario"
                                    type="color"
                                    value={data.color_primario}
                                    onChange={(e) => setData('color_primario', e.target.value)}
                                />
                                <input
                                    type="text"
                                    value={data.color_primario}
                                    onChange={(e) => setData('color_primario', e.target.value)}
                                />
                            </div>
                            <div className="color-presets-row">
                                {COLORES_BARBERIA.map((preset) => (
                                    <button
                                        key={preset.hex}
                                        type="button"
                                        className={`color-preset-btn ${data.color_primario?.toLowerCase() === preset.hex ? 'activo' : ''}`}
                                        onClick={() => setData('color_primario', preset.hex)}
                                    >
                                        <span
                                            className="color-preset-dot"
                                            style={{ backgroundColor: preset.hex }}
                                        />
                                        <span>{preset.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="campo" style={{ gridColumn: '1 / -1', marginTop: '0.8rem' }}>
                            <label>Plantilla de Diseño del Sitio (3 Estilos)</label>
                            <div className="template-picker-grid">
                                {PLANTILLAS_DISENO.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        className={`template-card-option ${data.tema_diseno === tpl.id ? 'activo' : ''}`}
                                        onClick={() => setData('tema_diseno', tpl.id)}
                                    >
                                        <div
                                            className="tpl-swatch-bar"
                                            style={{ background: tpl.swatchBg, color: tpl.swatchInk }}
                                        >
                                            <span>{tpl.tag}</span>
                                            <span>{data.tema_diseno === tpl.id ? '✓ Activo' : 'Elegir'}</span>
                                        </div>
                                        <strong>{tpl.nombre}</strong>
                                        <small>{tpl.desc}</small>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="superadmin-submit-row">
                    <button type="submit" className="boton" disabled={processing}>
                        {processing ? 'Guardando...' : 'Guardar Marca y Logo'}
                    </button>
                </div>
            </form>
        </>
    );
}
