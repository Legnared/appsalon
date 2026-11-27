import { Head, Link, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import SuperAdminTenantController from '@/actions/App/Http/Controllers/SuperAdminTenantController';

const COLORES_BARBERIA = [
    { nombre: 'Latón Clásico', hex: '#d4a259' },
    { nombre: 'Azul Barbería', hex: '#2f80ed' },
    { nombre: 'Azul Eléctrico', hex: '#0da6f3' },
    { nombre: 'Rojo Barber Pole', hex: '#d63b3b' },
    { nombre: 'Verde Esmeralda', hex: '#10b981' },
    { nombre: 'Cobre Vintage', hex: '#c87533' },
    { nombre: 'Acero Platino', hex: '#94a3b8' },
];

export default function SuperAdminForm({
    modo = 'crear',
    tenant = null,
    featuresCatalog = [],
    featuresActivos = {},
}) {
    const esEdicion = modo === 'editar' && tenant;

    const { data, setData, post, put, processing, errors } = useForm({
        nombre: tenant?.nombre ?? '',
        slug: tenant?.slug ?? '',
        dominio_custom: tenant?.dominio_custom ?? '',
        activo: tenant ? Boolean(tenant.activo) : true,
        plan: tenant?.plan ?? 'anual',
        suscripcion_vence_en: tenant?.suscripcion_vence_en ?? '',
        tagline: tenant?.tagline ?? 'Corte Clásico · Barba · Estilo',
        color_primario: tenant?.color_primario ?? '#d4a259',
        whatsapp_negocio: tenant?.whatsapp_negocio ?? '',
        payment_driver: tenant?.payment_driver ?? 'sandbox',
        anticipo_tipo: tenant?.anticipo_tipo ?? 'fijo',
        anticipo_valor: tenant?.anticipo_valor ?? 100,
        spei_banco: tenant?.spei_banco ?? 'Mercado Pago / STP',
        spei_titular: tenant?.spei_titular ?? '',
        spei_clabe: tenant?.spei_clabe ?? '',
        mercadopago_access_token: '',
        mercadopago_public_key: '',
        mercadopago_point_device_id: tenant?.mercadopago_point_device_id ?? '',
        mercadopago_webhook_url: tenant?.mercadopago_webhook_url ?? '',
        features: { ...featuresActivos },
        email_template: {
            encabezado: tenant?.email_template?.encabezado ?? 'EST. BARBER SHOP · COMUNICADO OFICIAL',
            asunto: tenant?.email_template?.asunto ?? 'Bienvenido a {barberia} · Agenda tu cita en línea',
            saludo: tenant?.email_template?.saludo ?? '¡Hola! Qué gusto saludarte desde {barberia}',
            cuerpo: tenant?.email_template?.cuerpo ?? 'Ya puedes agendar tu próximo corte o servicio de barba en segundos, elegir a tu barbero favorito y confirmar tu horario sin llamadas ni esperas.',
            boton_texto: tenant?.email_template?.boton_texto ?? 'Agendar mi Cita Ahora',
            pie: tenant?.email_template?.pie ?? 'Plataforma impulsada por Angel DevSign · Innovación en Código y Diseño.',
        },
        // Campos exclusivos de alta rápida
        dueno_nombre: '',
        dueno_apellido: '',
        dueno_email: '',
        dueno_password: '',
        dueno_telefono: '',
        sembrar_servicios_base: true,
    });

    const toggleFeature = (key) => {
        setData('features', {
            ...data.features,
            [key]: !data.features[key],
        });
    };

    const updateEmailField = (field, value) => {
        setData('email_template', {
            ...data.email_template,
            [field]: value,
        });
    };

    const probarPlantilla = async () => {
        if (!esEdicion) return;
        const { value: email } = await Swal.fire({
            title: `Probar Plantilla de ${data.nombre || tenant.nombre}`,
            text: 'Se enviará esta plantilla HTML tal como la estás editando.',
            input: 'email',
            inputPlaceholder: 'tu-correo@ejemplo.com',
            showCancelButton: true,
            confirmButtonText: 'Enviar prueba HTML',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: data.color_primario || '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        });

        if (email) {
            router.post(
                SuperAdminTenantController.enviarCorreoPrueba.url(),
                {
                    email,
                    tenant_id: tenant.id,
                    email_template: data.email_template,
                },
                { preserveScroll: true }
            );
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (esEdicion) {
            put(SuperAdminTenantController.actualizar.url({ tenant: tenant.id }));
        } else {
            post(SuperAdminTenantController.crear.url());
        }
    };

    return (
        <>
            <Head title={esEdicion ? `Editar ${tenant.nombre}` : 'Nueva Barbería SaaS'} />

            <div className="superadmin-header">
                <div>
                    <h1 className="nombre-pagina">
                        {esEdicion ? `Configurar ${tenant.nombre}` : 'Alta Rápida de Barbería'}
                    </h1>
                    <p className="descripcion-pagina">
                        {esEdicion
                            ? 'Ajusta marca, plan, pagos bancarios y módulos habilitados'
                            : 'Crea una nueva barbería lista para operar en menos de 1 minuto'}
                    </p>
                </div>

                <Link href={SuperAdminTenantController.index.url()} className="boton">
                    &laquo; Volver a Barberías
                </Link>
            </div>

            <Alertas errors={errors} />

            <form className="formulario superadmin-form" onSubmit={handleSubmit}>
                <section className="superadmin-section">
                    <h3>1. Identidad, Dominio y Suscripción</h3>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="nombre">Nombre de la Barbería</label>
                            <input
                                id="nombre"
                                type="text"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                placeholder="Ej. Barbería El Padrino"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="slug">Slug / Subdominio</label>
                            <input
                                id="slug"
                                type="text"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value.toLowerCase())}
                                placeholder="ej. el-padrino"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="dominio_custom">Dominio Propio (Opcional)</label>
                            <input
                                id="dominio_custom"
                                type="text"
                                value={data.dominio_custom}
                                onChange={(e) => setData('dominio_custom', e.target.value.toLowerCase())}
                                placeholder="ej. barberiaelpadrino.com"
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="plan">Plan Contratado</label>
                            <select
                                id="plan"
                                value={data.plan}
                                onChange={(e) => setData('plan', e.target.value)}
                            >
                                <option value="anual">Anual — $5,500 MXN (Mantenimiento incluido)</option>
                                <option value="mensual">Mensual — $600 + $300 MXN mantenimiento</option>
                                <option value="trial">Demo / Prueba</option>
                            </select>
                        </div>

                        <div className="campo">
                            <label htmlFor="suscripcion_vence_en">Vencimiento de Suscripción</label>
                            <input
                                id="suscripcion_vence_en"
                                type="date"
                                value={data.suscripcion_vence_en}
                                onChange={(e) => setData('suscripcion_vence_en', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="color_primario">Color de Acento (Paleta Barbería)</label>
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
                                        title={`${preset.nombre} (${preset.hex})`}
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

                        <div className="campo">
                            <label htmlFor="tagline">Eslogan / Tagline</label>
                            <input
                                id="tagline"
                                type="text"
                                value={data.tagline}
                                onChange={(e) => setData('tagline', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="whatsapp_negocio">WhatsApp del Negocio (con LADA)</label>
                            <input
                                id="whatsapp_negocio"
                                type="text"
                                value={data.whatsapp_negocio}
                                onChange={(e) => setData('whatsapp_negocio', e.target.value)}
                                placeholder="5216310000000"
                            />
                        </div>
                    </div>
                </section>

                {!esEdicion && (
                    <section className="superadmin-section">
                        <h3>2. Cuenta del Dueño / Administrador de la Barbería</h3>
                        <p className="superadmin-hint">
                            Se creará con rol Admin + Barbero (acceso total a su negocio, sin acceso a Bitácora ni Super-Admin).
                        </p>

                        <div className="superadmin-grid-2">
                            <div className="campo">
                                <label htmlFor="dueno_nombre">Nombre del Dueño</label>
                                <input
                                    id="dueno_nombre"
                                    type="text"
                                    value={data.dueno_nombre}
                                    onChange={(e) => setData('dueno_nombre', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="dueno_apellido">Apellido</label>
                                <input
                                    id="dueno_apellido"
                                    type="text"
                                    value={data.dueno_apellido}
                                    onChange={(e) => setData('dueno_apellido', e.target.value)}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="dueno_email">Email de Acceso</label>
                                <input
                                    id="dueno_email"
                                    type="email"
                                    value={data.dueno_email}
                                    onChange={(e) => setData('dueno_email', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="dueno_password">Contraseña Inicial</label>
                                <input
                                    id="dueno_password"
                                    type="password"
                                    value={data.dueno_password}
                                    onChange={(e) => setData('dueno_password', e.target.value)}
                                    minLength={6}
                                    required
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="dueno_telefono">Teléfono</label>
                                <input
                                    id="dueno_telefono"
                                    type="text"
                                    value={data.dueno_telefono}
                                    onChange={(e) => setData('dueno_telefono', e.target.value)}
                                />
                            </div>

                            <label className="superadmin-checkbox">
                                <input
                                    type="checkbox"
                                    checked={data.sembrar_servicios_base}
                                    onChange={(e) => setData('sembrar_servicios_base', e.target.checked)}
                                />
                                <span>Sembrar 4 servicios iniciales + horarios L-S automáticamente</span>
                            </label>
                        </div>
                    </section>
                )}

                <section className="superadmin-section">
                    <h3>{esEdicion ? '2' : '3'}. Pagos, Anticipo y SPEI de esta Barbería</h3>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="payment_driver">Pasarela de Pagos</label>
                            <select
                                id="payment_driver"
                                value={data.payment_driver}
                                onChange={(e) => setData('payment_driver', e.target.value)}
                            >
                                <option value="sandbox">Sandbox (Simulado / Pruebas)</option>
                                <option value="mercadopago">Mercado Pago (Checkout Pro + Point)</option>
                                <option value="bank_api">API Bancaria Genérica</option>
                            </select>
                        </div>

                        <div className="campo">
                            <label htmlFor="anticipo_tipo">Tipo de Anticipo</label>
                            <select
                                id="anticipo_tipo"
                                value={data.anticipo_tipo}
                                onChange={(e) => setData('anticipo_tipo', e.target.value)}
                            >
                                <option value="fijo">Monto Fijo ($ MXN)</option>
                                <option value="porcentaje">Porcentaje (%)</option>
                            </select>
                        </div>

                        <div className="campo">
                            <label htmlFor="anticipo_valor">Valor del Anticipo</label>
                            <input
                                id="anticipo_valor"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.anticipo_valor}
                                onChange={(e) => setData('anticipo_valor', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="spei_banco">Banco SPEI</label>
                            <input
                                id="spei_banco"
                                type="text"
                                value={data.spei_banco}
                                onChange={(e) => setData('spei_banco', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="spei_titular">Titular SPEI</label>
                            <input
                                id="spei_titular"
                                type="text"
                                value={data.spei_titular}
                                onChange={(e) => setData('spei_titular', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="spei_clabe">CLABE Interbancaria (18 dígitos)</label>
                            <input
                                id="spei_clabe"
                                type="text"
                                value={data.spei_clabe}
                                onChange={(e) => setData('spei_clabe', e.target.value)}
                            />
                        </div>

                        {esEdicion && (
                            <>
                                <div className="campo">
                                    <label htmlFor="mercadopago_access_token">
                                        Mercado Pago Access Token {tenant.tiene_mp_token ? '(Configurado · dejar vacío para conservar)' : '(Opcional)'}
                                    </label>
                                    <input
                                        id="mercadopago_access_token"
                                        type="password"
                                        value={data.mercadopago_access_token}
                                        onChange={(e) => setData('mercadopago_access_token', e.target.value)}
                                        placeholder="APP_USR-..."
                                    />
                                </div>

                                <div className="campo">
                                    <label htmlFor="mercadopago_point_device_id">Mercado Pago Point Device ID</label>
                                    <input
                                        id="mercadopago_point_device_id"
                                        type="text"
                                        value={data.mercadopago_point_device_id}
                                        onChange={(e) => setData('mercadopago_point_device_id', e.target.value)}
                                        placeholder="PAX_A910__..."
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <section className="superadmin-section">
                    <h3>{esEdicion ? '3' : '4'}. Módulos Habilitados (Feature Flags)</h3>
                    <p className="superadmin-hint">
                        Activa o apaga módulos individuales según el plan contratado por esta barbería.
                    </p>

                    <div className="features-toggle-grid">
                        {featuresCatalog.map((item) => {
                            const activo = Boolean(data.features?.[item.key]);
                            return (
                                <label
                                    key={item.key}
                                    className={`feature-toggle-card ${activo ? 'activo' : ''}`}
                                >
                                    <div className="feature-toggle-info">
                                        <span className="feature-cat">{item.categoria}</span>
                                        <strong>{item.nombre}</strong>
                                        <small>{item.descripcion}</small>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={activo}
                                        onChange={() => toggleFeature(item.key)}
                                    />
                                </label>
                            );
                        })}
                    </div>
                </section>

                {esEdicion && (
                    <section className="superadmin-section">
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>4. Plantilla de Correo HTML (Personalizable)</h3>
                                <p className="superadmin-hint" style={{ margin: '0.4rem 0 0' }}>
                                    Usa <code>{'{barberia}'}</code> para insertar automáticamente el nombre de la barbería. El diseño hereda el color de acento.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="boton boton-secundario"
                                style={{ margin: 0, padding: '0.8rem 1.4rem', fontSize: '1.3rem' }}
                                onClick={probarPlantilla}
                            >
                                Enviar Prueba HTML
                            </button>
                        </div>

                        <div className="superadmin-grid-2">
                            <div className="campo">
                                <label htmlFor="tpl_encabezado">Etiqueta Superior</label>
                                <input
                                    id="tpl_encabezado"
                                    type="text"
                                    value={data.email_template.encabezado}
                                    onChange={(e) => updateEmailField('encabezado', e.target.value)}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="tpl_asunto">Asunto del Correo</label>
                                <input
                                    id="tpl_asunto"
                                    type="text"
                                    value={data.email_template.asunto}
                                    onChange={(e) => updateEmailField('asunto', e.target.value)}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="tpl_saludo">Título / Saludo</label>
                                <input
                                    id="tpl_saludo"
                                    type="text"
                                    value={data.email_template.saludo}
                                    onChange={(e) => updateEmailField('saludo', e.target.value)}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="tpl_boton">Texto del Botón CTA</label>
                                <input
                                    id="tpl_boton"
                                    type="text"
                                    value={data.email_template.boton_texto}
                                    onChange={(e) => updateEmailField('boton_texto', e.target.value)}
                                />
                            </div>

                            <div className="campo" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="tpl_cuerpo">Mensaje Principal</label>
                                <textarea
                                    id="tpl_cuerpo"
                                    rows={4}
                                    value={data.email_template.cuerpo}
                                    onChange={(e) => updateEmailField('cuerpo', e.target.value)}
                                    style={{ width: '100%', padding: '1rem 1.2rem', borderRadius: '0.9rem', fontSize: '1.4rem' }}
                                />
                            </div>

                            <div className="campo" style={{ gridColumn: '1 / -1' }}>
                                <label htmlFor="tpl_pie">Pie de Correo (Firma)</label>
                                <input
                                    id="tpl_pie"
                                    type="text"
                                    value={data.email_template.pie}
                                    onChange={(e) => updateEmailField('pie', e.target.value)}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                marginTop: '2rem',
                                padding: '2rem',
                                borderRadius: '1.4rem',
                                background: '#0f1115',
                                border: `1px solid ${data.color_primario || '#d4a259'}55`,
                                borderTop: `4px solid ${data.color_primario || '#d4a259'}`,
                            }}
                        >
                            <div style={{ textAlign: 'center', paddingBottom: '1.4rem', borderBottom: `1px solid ${data.color_primario || '#d4a259'}33` }}>
                                <div style={{ fontSize: '1.05rem', letterSpacing: '0.2rem', textTransform: 'uppercase', color: data.color_primario || '#d4a259', fontWeight: 700 }}>
                                    {(data.email_template.encabezado || '').replaceAll('{barberia}', data.nombre || tenant.nombre)}
                                </div>
                                <div style={{ fontSize: '2.4rem', fontWeight: 700, color: '#ffffff', marginTop: '0.4rem', fontFamily: 'Georgia, serif' }}>
                                    {data.nombre || tenant.nombre}
                                </div>
                                <div style={{ fontSize: '1.25rem', color: '#b8bec9' }}>{data.tagline}</div>
                            </div>
                            <div style={{ padding: '1.8rem 0.6rem' }}>
                                <strong style={{ display: 'block', fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.8rem' }}>
                                    {(data.email_template.saludo || '').replaceAll('{barberia}', data.nombre || tenant.nombre)}
                                </strong>
                                <p style={{ fontSize: '1.4rem', color: '#dfe3ea', lineHeight: 1.6, margin: '0 0 1.8rem', whiteSpace: 'pre-line' }}>
                                    {(data.email_template.cuerpo || '').replaceAll('{barberia}', data.nombre || tenant.nombre)}
                                </p>
                                <div style={{ textAlign: 'center' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '1rem 2.4rem',
                                            borderRadius: '1rem',
                                            backgroundColor: data.color_primario || '#d4a259',
                                            color: '#111317',
                                            fontWeight: 700,
                                            fontSize: '1.4rem',
                                        }}
                                    >
                                        {data.email_template.boton_texto || 'Agendar mi Cita Ahora'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', paddingTop: '1.2rem', borderTop: '1px solid #262b35', fontSize: '1.15rem', color: '#9aa2b0' }}>
                                {(data.email_template.pie || '').replaceAll('{barberia}', data.nombre || tenant.nombre)}
                            </div>
                        </div>
                    </section>
                )}

                <div className="superadmin-submit-row">
                    <button type="submit" className="boton" disabled={processing}>
                        {processing
                            ? 'Guardando...'
                            : esEdicion
                                ? 'Guardar Cambios de la Barbería'
                                : 'Crear Barbería Ahora'}
                    </button>
                </div>
            </form>
        </>
    );
}
