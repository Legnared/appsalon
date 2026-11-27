import { Head, router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import Alertas from '@/Components/Alertas';
import PasswordInput from '@/Components/PasswordInput';
import SuperAdminCuentaController from '@/actions/App/Http/Controllers/SuperAdminCuentaController';

const COLUMNAS_PERMISOS = [
    { key: 'super_admin', label: 'Super-Admin' },
    { key: 'bitacora', label: 'Bitácora' },
    { key: 'agenda_barberia', label: 'Agenda' },
    { key: 'servicios_horarios', label: 'Servicios / Horarios' },
    { key: 'barberos_crm', label: 'Barberos / CRM' },
    { key: 'mi_marca', label: 'Mi Marca' },
    { key: 'agendar_citas', label: 'Portal Cliente' },
];

export default function CuentaRoles({ perfil, matrizRoles = [], cuentasAdmin = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        nombre: perfil?.nombre ?? '',
        apellido: perfil?.apellido ?? '',
        email: perfil?.email ?? '',
        telefono: perfil?.telefono ?? '',
        password_actual: '',
        password_nuevo: '',
        password_nuevo_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(SuperAdminCuentaController.actualizarPerfil.url(), {
            preserveScroll: true,
            onSuccess: () => reset('password_actual', 'password_nuevo', 'password_nuevo_confirmation'),
        });
    };

    const cambiarPasswordDirecto = async (cuenta) => {
        const { value: password } = await Swal.fire({
            title: `Nueva clave para ${cuenta.nombre}`,
            text: `${cuenta.tipo} · ${cuenta.barberia} (${cuenta.email})`,
            input: 'password',
            inputPlaceholder: 'Mínimo 6 caracteres',
            inputAttributes: { minlength: 6, autocomplete: 'new-password' },
            showCancelButton: true,
            confirmButtonText: 'Guardar nueva clave',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
            inputValidator: (val) => {
                if (!val || val.length < 6) {
                    return 'La contraseña debe tener al menos 6 caracteres';
                }
                return null;
            },
        });

        if (password) {
            router.post(
                SuperAdminCuentaController.cambiarPasswordUsuario.url({ usuarioId: cuenta.id }),
                { password },
                { preserveScroll: true }
            );
        }
    };

    const enviarResetCorreo = async (cuenta) => {
        const result = await Swal.fire({
            icon: 'question',
            title: `¿Enviar enlace de recuperación?`,
            text: `Se enviará un correo de restablecimiento a ${cuenta.email} (${cuenta.barberia}).`,
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar correo',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d4a259',
            cancelButtonColor: '#28221c',
            background: '#1f1b17',
            color: '#f5efe6',
        });

        if (result.isConfirmed) {
            router.post(
                SuperAdminCuentaController.enviarResetUsuario.url({ usuarioId: cuenta.id }),
                {},
                { preserveScroll: true }
            );
        }
    };

    return (
        <>
            <Head title="Mi Cuenta y Matriz de Roles" />

            <h1 className="nombre-pagina">Mi Cuenta y Matriz de Roles</h1>
            <p className="descripcion-pagina">
                Administra tus credenciales de Super-Admin y revisa los permisos de cada rol del SaaS
            </p>

            <Alertas errors={errors} />

            <form className="formulario superadmin-form" onSubmit={handleSubmit}>
                <section className="superadmin-section">
                    <h3>1. Credenciales del Super-Admin</h3>
                    <p className="superadmin-hint">
                        Puedes actualizar tu nombre, correo de inicio de sesión o contraseña. Para cambiar correo o contraseña ingresa tu contraseña actual.
                    </p>

                    <div className="superadmin-grid-2">
                        <div className="campo">
                            <label htmlFor="sa_nombre">Nombre</label>
                            <input
                                id="sa_nombre"
                                type="text"
                                value={data.nombre}
                                onChange={(e) => setData('nombre', e.target.value)}
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="sa_apellido">Apellido</label>
                            <input
                                id="sa_apellido"
                                type="text"
                                value={data.apellido}
                                onChange={(e) => setData('apellido', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="sa_email">Correo de Acceso</label>
                            <input
                                id="sa_email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="sa_telefono">Teléfono</label>
                            <input
                                id="sa_telefono"
                                type="text"
                                value={data.telefono}
                                onChange={(e) => setData('telefono', e.target.value)}
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="sa_pass_nuevo">Nueva Contraseña (opcional, mín. 6 caracteres)</label>
                            <PasswordInput
                                id="sa_pass_nuevo"
                                value={data.password_nuevo}
                                onChange={(e) => setData('password_nuevo', e.target.value)}
                                placeholder="Dejar vacío para conservar la actual"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="campo">
                            <label htmlFor="sa_pass_confirm">Repetir Nueva Contraseña</label>
                            <PasswordInput
                                id="sa_pass_confirm"
                                value={data.password_nuevo_confirmation}
                                onChange={(e) => setData('password_nuevo_confirmation', e.target.value)}
                                placeholder="Repite la nueva contraseña"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="superadmin-submit-row" style={{ marginTop: '1.6rem' }}>
                        <button type="submit" className="boton" disabled={processing}>
                            {processing ? 'Guardando...' : 'Actualizar Mi Cuenta'}
                        </button>
                    </div>
                </section>
            </form>

            <section className="superadmin-section" style={{ marginTop: '2.2rem' }}>
                <h3>2. Matriz de Roles y Permisos del SaaS</h3>
                <p className="superadmin-hint">
                    Separación estricta entre administración técnica global y operación aislada de cada barbería.
                </p>

                <div className="roles-matrix-wrap">
                    <table className="roles-matrix-table">
                        <thead>
                            <tr>
                                <th>Rol</th>
                                <th>Alcance</th>
                                <th>Usuarios</th>
                                {COLUMNAS_PERMISOS.map((col) => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrizRoles.map((row) => (
                                <tr key={row.rol}>
                                    <td>
                                        <strong>{row.rol}</strong>
                                        <small>{row.identificador}</small>
                                    </td>
                                    <td>{row.alcance}</td>
                                    <td className="num-col">{row.usuarios}</td>
                                    {COLUMNAS_PERMISOS.map((col) => (
                                        <td key={col.key} className="perm-col">
                                            <span className={`perm-dot ${row.permisos?.[col.key] ? 'si' : 'no'}`}>
                                                {row.permisos?.[col.key] ? '✓' : '—'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="superadmin-section" style={{ marginTop: '2.2rem' }}>
                <h3>3. Directorio de Dueños, Admins y Barberos (Soporte de Contraseñas)</h3>
                <p className="superadmin-hint">
                    Si un dueño o barbero olvida su acceso, puedes enviarle un correo de recuperación o asignarle una nueva contraseña temporal al instante.
                </p>
                <div className="roles-matrix-wrap">
                    <table className="roles-matrix-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th>Tipo</th>
                                <th>Barbería</th>
                                <th>Estado</th>
                                <th>Soporte de Acceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cuentasAdmin.map((c) => (
                                <tr key={c.id}>
                                    <td><strong>{c.nombre}</strong></td>
                                    <td>{c.email}</td>
                                    <td>{c.tipo}</td>
                                    <td>{c.barberia}</td>
                                    <td>
                                        <span className={`tenant-status-badge ${c.activo ? 'activo' : 'inactivo'}`}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        {c.es_propia ? (
                                            <span style={{ fontSize: '1.15rem', opacity: 0.7 }}>Tu cuenta (edita arriba)</span>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                <button
                                                    type="button"
                                                    className="boton"
                                                    style={{ margin: 0, padding: '0.55rem 1rem', fontSize: '1.2rem' }}
                                                    onClick={() => cambiarPasswordDirecto(c)}
                                                >
                                                    Nueva Clave
                                                </button>
                                                <button
                                                    type="button"
                                                    className="boton boton-secundario"
                                                    style={{ margin: 0, padding: '0.55rem 1rem', fontSize: '1.2rem' }}
                                                    onClick={() => enviarResetCorreo(c)}
                                                >
                                                    Enviar Reset
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
