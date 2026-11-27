import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import SuperAdminTenantController from '@/actions/App/Http/Controllers/SuperAdminTenantController';

const PLAN_LABELS = {
    anual: 'Anual ($5,500)',
    mensual: 'Mensual ($600 + $300)',
    trial: 'Prueba / Demo',
};

export default function SuperAdminIndex({ tenants = [], resumen = {}, infra = {} }) {
    const copiarEnlace = async (url, nombre) => {
        try {
            await navigator.clipboard.writeText(url);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `Enlace de ${nombre} copiado`,
                showConfirmButton: false,
                timer: 2000,
                background: '#1f1b17',
                color: '#f5efe6',
            });
        } catch {
            // Fallback silencioso
        }
    };

    const probarCorreo = async () => {
        const { value: email } = await Swal.fire({
            title: 'Enviar Correo de Prueba',
            text: `Driver activo: ${infra.mail_mailer || 'log'} · Remitente: ${infra.mail_from || ''}`,
            input: 'email',
            inputPlaceholder: 'tu-correo@ejemplo.com',
            showCancelButton: true,
            confirmButtonText: 'Enviar prueba',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        });

        if (email) {
            router.post(SuperAdminTenantController.enviarCorreoPrueba.url(), { email }, {
                preserveScroll: true,
            });
        }
    };

    const toggleEstado = async (tenant) => {
        const accion = tenant.activo ? 'suspender' : 'reactivar';
        const result = await Swal.fire({
            icon: tenant.activo ? 'warning' : 'question',
            title: `¿${tenant.activo ? 'Suspender' : 'Reactivar'} a ${tenant.nombre}?`,
            text: tenant.activo
                ? 'Mientras esté suspendida, su enlace mostrará un aviso de suscripción suspendida (HTTP 403).'
                : 'La barbería volverá a operar inmediatamente con todos sus datos intactos.',
            showCancelButton: true,
            confirmButtonText: tenant.activo ? 'Sí, suspender' : 'Sí, reactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: tenant.activo ? '#b83232' : '#329f00',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        });

        if (result.isConfirmed) {
            router.post(SuperAdminTenantController.toggleActivo.url({ tenant: tenant.id }), {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Super-Admin SaaS" />

            <div className="superadmin-header">
                <div>
                    <h1 className="nombre-pagina">Panel Super-Admin SaaS</h1>
                    <p className="descripcion-pagina">
                        Control Multi-Tenant de barberías, suscripciones y módulos activos
                    </p>
                </div>

                <Link
                    href={SuperAdminTenantController.showCrear.url()}
                    className="boton superadmin-btn-nueva"
                >
                    + Nueva Barbería
                </Link>
            </div>

            <Alertas />

            <div className="bitacora-readonly-banner" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.2rem' }}>
                <div>
                    <strong>Correo SaaS ({infra.mail_mailer || 'log'}):</strong>{' '}
                    {infra.resend_configurado ? 'Resend API configurada' : 'Modo pruebas/log (configura RESEND_KEY para envíos reales)'}
                    {' · '}
                    <strong>Wildcard DNS:</strong>{' '}
                    {infra.base_domain ? `*.${infra.base_domain}` : 'Sin APP_BASE_DOMAIN (usando ?tenant= en local)'}
                </div>
                <button
                    type="button"
                    className="boton boton-secundario"
                    style={{ margin: 0, padding: '0.7rem 1.4rem', fontSize: '1.3rem' }}
                    onClick={probarCorreo}
                >
                    Probar Correo
                </button>
            </div>

            <div className="resumen-kpi-grid superadmin-kpis">
                <div className="kpi-card">
                    <span className="kpi-label">Barberías Totales</span>
                    <strong className="kpi-valor">{resumen.total_barberias ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Suscripciones Activas</span>
                    <strong className="kpi-valor">{resumen.activas ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Plan Anual</span>
                    <strong className="kpi-valor">{resumen.plan_anual ?? 0}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Citas Globales</span>
                    <strong className="kpi-valor">{resumen.citas_globales ?? 0}</strong>
                </div>
            </div>

            <div className="superadmin-tenants-grid">
                {tenants.map((t) => (
                    <article
                        key={t.id}
                        className={`tenant-card ${t.activo ? '' : 'suspendido'}`}
                        style={{ '--tenant-accent': t.color_primario || '#d4a259' }}
                    >
                        <div className="tenant-card-top">
                            <div className="tenant-title-wrap">
                                <span
                                    className="tenant-color-dot"
                                    style={{ backgroundColor: t.color_primario || '#d4a259' }}
                                />
                                <div>
                                    <h3>{t.nombre}</h3>
                                    <span className="tenant-slug">
                                        slug: <strong>{t.slug}</strong>
                                        {t.dominio_custom ? ` · ${t.dominio_custom}` : ''}
                                    </span>
                                    {t.public_url && (
                                        <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            <span className="tenant-slug" style={{ fontSize: '1.15rem' }}>{t.public_url}</span>
                                            <button
                                                type="button"
                                                onClick={() => copiarEnlace(t.public_url, t.nombre)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.08)',
                                                    border: '1px solid rgba(255,255,255,0.18)',
                                                    color: '#f5efe6',
                                                    borderRadius: '0.5rem',
                                                    padding: '0.2rem 0.65rem',
                                                    fontSize: '1.1rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Copiar link
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <span className={`tenant-status-badge ${t.activo ? 'activo' : 'inactivo'}`}>
                                {t.activo ? 'Activa' : 'Suspendida'}
                            </span>
                        </div>

                        <div className="tenant-meta-row">
                            <span className="tenant-pill plan">{PLAN_LABELS[t.plan] || t.plan}</span>
                            <span className="tenant-pill">
                                Módulos: {t.modulos_activos}/{t.modulos_total}
                            </span>
                            <span className="tenant-pill">Driver: {t.payment_driver}</span>
                            {t.suscripcion_vence_en && (
                                <span className="tenant-pill">Vence: {t.suscripcion_vence_en}</span>
                            )}
                        </div>

                        <div className="tenant-stats-row">
                            <div>
                                <span>Usuarios</span>
                                <strong>{t.usuarios_count}</strong>
                            </div>
                            <div>
                                <span>Servicios</span>
                                <strong>{t.servicios_count}</strong>
                            </div>
                            <div>
                                <span>Citas</span>
                                <strong>{t.citas_count}</strong>
                            </div>
                        </div>

                        <div className="tenant-card-actions">
                            <a
                                href={SuperAdminTenantController.previsualizar.url({ tenant: t.id })}
                                className="boton"
                            >
                                Previsualizar
                            </a>
                            <Link
                                href={SuperAdminTenantController.showEditar.url({ tenant: t.id })}
                                className="boton boton-secundario"
                            >
                                Editar / Módulos
                            </Link>
                            <button
                                type="button"
                                className={t.activo ? 'boton-eliminar' : 'boton'}
                                onClick={() => toggleEstado(t)}
                            >
                                {t.activo ? 'Suspender' : 'Reactivar'}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </>
    );
}
