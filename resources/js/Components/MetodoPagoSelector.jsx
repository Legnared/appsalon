import { useState } from 'react';

function formatearNumeroTarjeta(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 16);
    return digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatearExpiracion(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 4);
    if (digitos.length <= 2) return digitos;
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

function detectarMarca(numero) {
    const digitos = (numero || '').replace(/\D/g, '');
    if (digitos.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(digitos)) return 'MASTERCARD';
    if (/^3[47]/.test(digitos)) return 'AMEX';
    return '';
}

export function calcularMontoAnticipo(total, pagoConfig) {
    const totalNum = Number(total || 0);
    if (totalNum <= 0) return 0;

    const tipo = pagoConfig?.anticipo_tipo || 'fijo';
    const valor = Number(pagoConfig?.anticipo_valor ?? 100);
    const calculado = tipo === 'porcentaje' ? (totalNum * valor) / 100 : valor;
    return Math.round(Math.min(totalNum, Math.max(1, calculado)) * 100) / 100;
}

export default function MetodoPagoSelector({
    total = 0,
    tipoCobro = 'anticipo',
    setTipoCobro,
    pagoConfig = {},
    metodoPago,
    setMetodoPago,
    tarjeta,
    setTarjeta,
    terminalModo,
    setTerminalModo,
}) {
    const [copiado, setCopiado] = useState(false);
    const marca = detectarMarca(tarjeta.numero);
    const totalNum = Number(total || 0);
    const montoAnticipo = calcularMontoAnticipo(totalNum, pagoConfig);
    const puedeAnticipo = totalNum > montoAnticipo && montoAnticipo > 0;
    const esEnSucursal = metodoPago === 'terminal_pos' || metodoPago === 'efectivo';
    const usaAnticipo = !esEnSucursal && tipoCobro === 'anticipo' && puedeAnticipo;
    const montoAhora = esEnSucursal ? 0 : usaAnticipo ? montoAnticipo : totalNum;
    const saldoRestante = Math.max(0, Math.round((totalNum - montoAhora) * 100) / 100);
    const esMercadoPagoPro = pagoConfig?.driver === 'mercadopago';
    const spei = pagoConfig?.spei || {};

    const copiarClabe = async () => {
        if (!spei.clabe) return;
        try {
            await navigator.clipboard.writeText(spei.clabe);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch {
            // Fallback silencioso si el navegador restringe clipboard
        }
    };

    return (
        <div className="pagos-bloque">
            <div className="pagos-total-banner">
                <div>
                    <span className="pagos-total-label">Total de Servicios</span>
                    {usaAnticipo && (
                        <p className="pagos-desglose-sub">
                            Pagas ahora <strong>${montoAhora.toFixed(2)}</strong> · Restante en
                            barbería <strong>${saldoRestante.toFixed(2)}</strong>
                        </p>
                    )}
                </div>
                <strong className="pagos-total-monto">${totalNum.toFixed(2)} MXN</strong>
            </div>

            <div
                className="pagos-metodos-grid"
                role="radiogroup"
                aria-label="Método de pago"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(19rem, 1fr))',
                    gap: '1rem',
                }}
            >
                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'efectivo' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('efectivo')}
                >
                    <strong>Efectivo en Barbería</strong>
                    <span>Paga con dinero físico al llegar o terminar tu servicio.</span>
                </button>

                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'transferencia' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('transferencia')}
                >
                    <strong>Transferencia SPEI</strong>
                    <span>Transfiere desde tu app bancaria y envía tu comprobante por WhatsApp.</span>
                </button>

                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'terminal_pos' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('terminal_pos')}
                >
                    <strong>Terminal Point</strong>
                    <span>Paga al llegar a la barbería con tarjeta en terminal física.</span>
                </button>

                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'tarjeta_online' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('tarjeta_online')}
                >
                    <strong>Tarjeta / Mercado Pago</strong>
                    <span>Crédito, débito o cuenta Mercado Pago con confirmación inmediata.</span>
                </button>
            </div>

            {!esEnSucursal && puedeAnticipo && (
                <div className="pagos-tipo-cobro">
                    <span className="pagos-subtitulo">¿Cuánto deseas pagar ahora?</span>
                    <div className="tipo-cobro-grid">
                        <button
                            type="button"
                            className={`tipo-cobro-btn ${tipoCobro === 'anticipo' ? 'activo' : ''}`}
                            onClick={() => setTipoCobro('anticipo')}
                        >
                            <strong>Pagar Anticipo · ${montoAnticipo.toFixed(2)}</strong>
                            <span>
                                Aparta tu lugar y liquida ${(totalNum - montoAnticipo).toFixed(2)} al
                                terminar tu servicio.
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`tipo-cobro-btn ${tipoCobro === 'total' ? 'activo' : ''}`}
                            onClick={() => setTipoCobro('total')}
                        >
                            <strong>Pagar 100% · ${totalNum.toFixed(2)}</strong>
                            <span>Llega a tu cita con todo pagado y sin saldo pendiente.</span>
                        </button>
                    </div>
                </div>
            )}

            {metodoPago === 'tarjeta_online' && (
                esMercadoPagoPro ? (
                    <div className="spei-datos-card">
                        <p className="spei-titulo">Checkout Seguro de Mercado Pago</p>
                        <p className="nota-seguridad" style={{ marginTop: 0 }}>
                            Al confirmar tu cita generaremos tu enlace oficial de pago en Mercado Pago
                            por <strong>${montoAhora.toFixed(2)} MXN</strong>. Puedes pagar con tarjeta,
                            dinero en cuenta o saldo disponible.
                        </p>
                    </div>
                ) : (
                    <div className="tarjeta-form-grid">
                        <div className="tarjeta-campo">
                            <label htmlFor="tarjeta_titular">Titular de la Tarjeta</label>
                            <input
                                id="tarjeta_titular"
                                type="text"
                                placeholder="Como aparece en la tarjeta"
                                value={tarjeta.titular}
                                onChange={(e) =>
                                    setTarjeta((prev) => ({ ...prev, titular: e.target.value }))
                                }
                            />
                        </div>

                        <div className="tarjeta-campo">
                            <label htmlFor="tarjeta_numero">
                                <span>Número de Tarjeta</span>
                                {marca && <span className="marca-badge">{marca}</span>}
                            </label>
                            <input
                                id="tarjeta_numero"
                                type="text"
                                inputMode="numeric"
                                placeholder="4242 4242 4242 4242"
                                value={tarjeta.numero}
                                onChange={(e) =>
                                    setTarjeta((prev) => ({
                                        ...prev,
                                        numero: formatearNumeroTarjeta(e.target.value),
                                    }))
                                }
                            />
                        </div>

                        <div className="tarjeta-fila-doble">
                            <div className="tarjeta-campo">
                                <label htmlFor="tarjeta_expiracion">Expiración (MM/AA)</label>
                                <input
                                    id="tarjeta_expiracion"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="12/28"
                                    value={tarjeta.expiracion}
                                    onChange={(e) =>
                                        setTarjeta((prev) => ({
                                            ...prev,
                                            expiracion: formatearExpiracion(e.target.value),
                                        }))
                                    }
                                />
                            </div>

                            <div className="tarjeta-campo">
                                <label htmlFor="tarjeta_cvv">CVV</label>
                                <input
                                    id="tarjeta_cvv"
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    placeholder="123"
                                    value={tarjeta.cvv}
                                    onChange={(e) =>
                                        setTarjeta((prev) => ({
                                            ...prev,
                                            cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <p className="nota-seguridad">
                            Conexión segura Multi-Banco / Mercado Pago. Nunca almacenamos el número
                            completo ni el CVV de tu tarjeta.
                        </p>
                    </div>
                )
            )}

            {metodoPago === 'transferencia' && (
                <div className="spei-datos-card">
                    <p className="spei-titulo">Datos para Transferencia Bancaria (SPEI)</p>
                    <div className="spei-fila">
                        <span>Banco:</span>
                        <strong>{spei.banco || 'Mercado Pago / BBVA'}</strong>
                    </div>
                    <div className="spei-fila">
                        <span>Beneficiario:</span>
                        <strong>{spei.titular || 'Barber Dani'}</strong>
                    </div>
                    <div className="spei-fila spei-clabe-fila">
                        <span>CLABE:</span>
                        <div className="spei-clabe-wrap">
                            <code>{spei.clabe || '000000000000000000'}</code>
                            <button
                                type="button"
                                className="btn-copiar-clabe"
                                onClick={copiarClabe}
                            >
                                {copiado ? '¡Copiada!' : 'Copiar'}
                            </button>
                        </div>
                    </div>
                    <div className="spei-fila">
                        <span>Monto a transferir:</span>
                        <strong className="spei-monto">${montoAhora.toFixed(2)} MXN</strong>
                    </div>
                    <p className="nota-seguridad" style={{ marginTop: '1rem' }}>
                        Al pulsar reservar, tu lugar quedará apartado y te daremos un botón directo
                        para enviar tu comprobante por WhatsApp a la barbería.
                    </p>
                </div>
            )}

            {metodoPago === 'efectivo' && (
                <div className="spei-datos-card">
                    <p className="spei-titulo">Pago en Efectivo al Llegar a la Barbería</p>
                    <p className="nota-seguridad" style={{ marginTop: 0 }}>
                        Tu lugar queda apartado sin pago previo. Liquidarás{' '}
                        <strong>${totalNum.toFixed(2)} MXN</strong> en dinero físico al terminar tu
                        servicio. Si ese día prefieres pagar con terminal o transferencia SPEI, tu
                        barbero podrá cambiarlo sin problema al cobrarte.
                    </p>
                </div>
            )}

            {metodoPago === 'terminal_pos' && (
                <div className="terminal-opciones">
                    <label>
                        <input
                            type="radio"
                            name="terminal_modo"
                            checked={terminalModo === 'en_sucursal'}
                            onChange={() => setTerminalModo('en_sucursal')}
                        />
                        <span>Pagar al llegar con Terminal Mercado Pago Point o Efectivo</span>
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="terminal_modo"
                            checked={terminalModo === 'enviar_terminal'}
                            onChange={() => setTerminalModo('enviar_terminal')}
                        />
                        <span>Pre-generar orden de cobro en Terminal Point conectada</span>
                    </label>
                </div>
            )}
        </div>
    );
}
