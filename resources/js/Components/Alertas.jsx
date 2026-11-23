import { usePage } from '@inertiajs/react';

export default function Alertas({ alertas = {}, mostrarGlobales = true }) {
    const { errors = {}, flash = {} } = usePage().props;

    const lista = [];

    if (mostrarGlobales) {
        Object.values(errors).forEach((mensaje) => {
            if (Array.isArray(mensaje)) {
                mensaje.forEach((m) => lista.push({ tipo: 'error', mensaje: m }));
            } else if (mensaje) {
                lista.push({ tipo: 'error', mensaje });
            }
        });

        if (flash?.error) {
            lista.push({ tipo: 'error', mensaje: flash.error });
        }
        if (flash?.exito) {
            lista.push({ tipo: 'exito', mensaje: flash.exito });
        }
    }

    Object.entries(alertas).forEach(([tipo, mensajes]) => {
        if (Array.isArray(mensajes)) {
            mensajes.forEach((mensaje) => {
                if (mensaje) lista.push({ tipo, mensaje });
            });
        } else if (mensajes) {
            lista.push({ tipo, mensaje: mensajes });
        }
    });

    if (lista.length === 0) {
        return null;
    }

    return (
        <>
            {lista.map((item, idx) => (
                <div key={`${item.tipo}-${idx}`} className={`alerta ${item.tipo}`}>
                    {item.mensaje}
                </div>
            ))}
        </>
    );
}
