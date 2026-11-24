export default function ClienteFormulario({
    data,
    setData,
    barberos = [],
    esEdicion = false,
}) {
    return (
        <>
            <div className="campo">
                <label htmlFor="nombre">Nombre(s)</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre del cliente o prospecto"
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
                    placeholder="Apellido del cliente"
                    value={data.apellido}
                    onChange={(e) => setData('apellido', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="telefono">Teléfono (con LADA)</label>
                <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    maxLength={25}
                    placeholder="Ej. +52 1 631 248 7987"
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
                    placeholder="cliente@correo.com"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
            </div>

            <div className="campo">
                <label htmlFor="barbero_id">Barbero Asignado</label>
                <select
                    id="barbero_id"
                    name="barbero_id"
                    value={data.barbero_id ?? ''}
                    onChange={(e) => setData('barbero_id', e.target.value)}
                >
                    <option value="">Sin barbero asignado (General)</option>
                    {barberos.map((barbero) => (
                        <option key={barbero.id} value={barbero.id}>
                            {barbero.nombre_completo || `${barbero.nombre} ${barbero.apellido}`}
                            {barbero.especialidad ? ` — ${barbero.especialidad}` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="campo">
                <label htmlFor="password">
                    {esEdicion ? 'Nuevo Password' : 'Password (opcional)'}
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder={
                        esEdicion
                            ? 'Déjalo vacío para conservar el actual'
                            : 'Si lo dejas vacío se genera automáticamente'
                    }
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                />
            </div>

            <div className="campo campo-switch">
                <label htmlFor="confirmado" className="switch-label">
                    <input
                        type="checkbox"
                        id="confirmado"
                        checked={Boolean(data.confirmado)}
                        onChange={(e) => setData('confirmado', e.target.checked)}
                    />
                    <span>Cuenta confirmada (puede iniciar sesión y reservar citas)</span>
                </label>
            </div>
        </>
    );
}
