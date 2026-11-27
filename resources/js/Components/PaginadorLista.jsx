import { useEffect } from 'react';

function calcularPaginasVisibles(paginaActual, totalPaginas) {
    if (totalPaginas <= 5) {
        return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }

    const paginas = [1];
    const inicio = Math.max(2, paginaActual - 1);
    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

    if (inicio > 2) paginas.push('...');
    for (let p = inicio; p <= fin; p++) {
        paginas.push(p);
    }
    if (fin < totalPaginas - 1) paginas.push('...');
    paginas.push(totalPaginas);

    return paginas;
}

export function scrollSuaveAlInicio(targetSelector = null) {
    if (typeof window === 'undefined') return;

    if (targetSelector) {
        const el = document.querySelector(targetSelector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
    }

    const mainScroll = document.querySelector('.app-shell-main');
    if (mainScroll && mainScroll.scrollTop > 0) {
        mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

export default function PaginadorLista({
    total = 0,
    paginaActual = 1,
    porPagina = 6,
    onCambiarPagina,
    etiqueta = 'elementos',
    scrollTarget = null,
}) {
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

    useEffect(() => {
        if (paginaActual > totalPaginas && onCambiarPagina) {
            onCambiarPagina(totalPaginas);
        }
    }, [paginaActual, totalPaginas, onCambiarPagina]);

    if (total <= porPagina) return null;

    const desde = (paginaActual - 1) * porPagina + 1;
    const hasta = Math.min(total, paginaActual * porPagina);
    const paginas = calcularPaginasVisibles(paginaActual, totalPaginas);

    const irAPagina = (nuevaPagina) => {
        const clamped = Math.max(1, Math.min(totalPaginas, nuevaPagina));
        if (clamped === paginaActual) return;
        onCambiarPagina(clamped);
        scrollSuaveAlInicio(scrollTarget);
    };

    return (
        <nav className="paginador-lista" aria-label={`Paginación de ${etiqueta}`}>
            <span className="paginador-resumen">
                Mostrando <strong>{desde}–{hasta}</strong> de <strong>{total}</strong> {etiqueta}
            </span>

            <div className="paginador-controles">
                <button
                    type="button"
                    className="paginador-btn"
                    disabled={paginaActual <= 1}
                    onClick={() => irAPagina(paginaActual - 1)}
                >
                    &laquo; Anterior
                </button>

                <div className="paginador-numeros">
                    {paginas.map((item, idx) =>
                        item === '...' ? (
                            <span key={`sep-${idx}`} className="paginador-sep">
                                &hellip;
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                className={`paginador-num ${item === paginaActual ? 'activo' : ''}`}
                                aria-current={item === paginaActual ? 'page' : undefined}
                                onClick={() => irAPagina(item)}
                            >
                                {item}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    className="paginador-btn"
                    disabled={paginaActual >= totalPaginas}
                    onClick={() => irAPagina(paginaActual + 1)}
                >
                    Siguiente &raquo;
                </button>
            </div>
        </nav>
    );
}
