export const TIPOS_ROSTRO = [
    {
        id: 'redondo',
        nombre: 'Redondo',
        pista: 'Mejillas llenas y largo similar al ancho',
        margenes: 'Te favorecen laterales cortos en fade/taper + volumen superior y barba angulada para estilizar y alargar el rostro.',
        svg: (
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="32" cy="33" r="21" />
                <line x1="11" y1="33" x2="53" y2="33" strokeDasharray="3 3" opacity="0.55" />
                <line x1="32" y1="12" x2="32" y2="54" strokeDasharray="3 3" opacity="0.55" />
            </svg>
        ),
    },
    {
        id: 'ovalado',
        nombre: 'Ovalado',
        pista: 'Proporciones equilibradas y mentón suave',
        margenes: 'Es el rostro más versátil: te quedan bien casi todos los fades, crops, clásicos y barbas.',
        svg: (
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
                <ellipse cx="32" cy="33" rx="17" ry="23" />
                <line x1="15" y1="33" x2="49" y2="33" strokeDasharray="3 3" opacity="0.55" />
                <line x1="32" y1="10" x2="32" y2="56" strokeDasharray="3 3" opacity="0.55" />
            </svg>
        ),
    },
    {
        id: 'cuadrado',
        nombre: 'Cuadrado',
        pista: 'Mandíbula y frente anchas con ángulos marcados',
        margenes: 'Te favorecen degradados limpios (skin/low fade), buzz cut o side part que potencian la mandíbula definida.',
        svg: (
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="14" y="13" width="36" height="40" rx="8" />
                <line x1="14" y1="33" x2="50" y2="33" strokeDasharray="3 3" opacity="0.55" />
            </svg>
        ),
    },
    {
        id: 'alargado',
        nombre: 'Alargado',
        pista: 'Rostro más largo que ancho, frente o mentón estilizado',
        margenes: 'Te favorecen cortes con fleco o textura al frente (French Crop / Mullet) sin exceso de volumen alto arriba.',
        svg: (
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="18" y="9" width="28" height="46" rx="14" />
                <line x1="18" y1="32" x2="46" y2="32" strokeDasharray="3 3" opacity="0.55" />
            </svg>
        ),
    },
    {
        id: 'diamante',
        nombre: 'Diamante',
        pista: 'Pómulos marcados con frente y mentón más estrechos',
        margenes: 'Te favorecen cortes con textura superior, fleco ligero (Crop/Burst Fade) o barba corta que dé peso al mentón.',
        svg: (
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polygon points="32,10 51,32 32,55 13,32" strokeLinejoin="round" />
                <line x1="13" y1="32" x2="51" y2="32" strokeDasharray="3 3" opacity="0.55" />
            </svg>
        ),
    },
];

export default function GuiaTipoRostro({ seleccionado = '', onSeleccionar }) {
    const activo = TIPOS_ROSTRO.find((t) => t.id === seleccionado) ?? null;

    return (
        <section className="guia-rostro-box" aria-label="Guía de tipo de rostro">
            <div className="guia-rostro-header">
                <div>
                    <span className="guia-tag">Asesoría de Visagismo</span>
                    <h3>¿Qué corte favorece a tu tipo de rostro?</h3>
                    <p>
                        Elige la silueta más parecida a tu rostro para ver los márgenes y cortes que mejor te estilizan.
                    </p>
                </div>
                {seleccionado && (
                    <button
                        type="button"
                        className="btn-limpiar-rostro"
                        onClick={() => onSeleccionar('')}
                    >
                        Ver todos los cortes
                    </button>
                )}
            </div>

            <div className="guia-rostro-grid">
                {TIPOS_ROSTRO.map((tipo) => {
                    const esActivo = seleccionado === tipo.id;
                    return (
                        <button
                            key={tipo.id}
                            type="button"
                            className={`rostro-card ${esActivo ? 'activo' : ''}`}
                            onClick={() => onSeleccionar(esActivo ? '' : tipo.id)}
                        >
                            <div className="rostro-svg">{tipo.svg}</div>
                            <strong>{tipo.nombre}</strong>
                            <span>{tipo.pista}</span>
                        </button>
                    );
                })}
            </div>

            {activo && (
                <div className="guia-rostro-consejo">
                    <strong>Consejo para rostro {activo.nombre}:</strong>{' '}
                    <span>{activo.margenes}</span>
                </div>
            )}
        </section>
    );
}
