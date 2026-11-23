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

export default function MetodoPagoSelector({
    total = 0,
    metodoPago,
    setMetodoPago,
    tarjeta,
    setTarjeta,
    terminalModo,
    setTerminalModo,
}) {
    const marca = detectarMarca(tarjeta.numero);

    return (
        <div className="pagos-bloque">
            <div className="pagos-total-banner">
                <span className="pagos-total-label">Total a Pagar</span>
                <strong className="pagos-total-monto">${Number(total).toFixed(2)} MXN</strong>
            </div>

            <div className="pagos-metodos-grid" role="radiogroup" aria-label="Método de pago">
                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'tarjeta_online' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('tarjeta_online')}
                >
                    <strong>Tarjeta en Línea</strong>
                    <span>Crédito o débito directo en el dashboard con autorización inmediata.</span>
                </button>

                <button
                    type="button"
                    className={`metodo-card ${metodoPago === 'terminal_pos' ? 'activo' : ''}`}
                    onClick={() => setMetodoPago('terminal_pos')}
                >
                    <strong>Terminal Punto de Venta (POS)</strong>
                    <span>Paga con tarjeta física en la terminal del salón al llegar.</span>
                </button>
            </div>

            {metodoPago === 'tarjeta_online' ? (
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
                        Conexión segura Multi-Banco. Nunca almacenamos el número completo ni el CVV de tu tarjeta.
                    </p>
                </div>
            ) : (
                <div className="terminal-opciones">
                    <label>
                        <input
                            type="radio"
                            name="terminal_modo"
                            checked={terminalModo === 'en_sucursal'}
                            onChange={() => setTerminalModo('en_sucursal')}
                        />
                        <span>Pagar con Terminal física al llegar a la barbería</span>
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="terminal_modo"
                            checked={terminalModo === 'enviar_terminal'}
                            onChange={() => setTerminalModo('enviar_terminal')}
                        />
                        <span>Pre-generar orden de cobro en Terminal POS conectada</span>
                    </label>
                </div>
            )}
        </div>
    );
}
