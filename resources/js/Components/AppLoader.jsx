import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

export default function AppLoader() {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const offStart = router.on('start', (event) => {
            // No mostrar overlay completo para recargas parciales rápidas (ej. filtro de agenda)
            if (event?.detail?.visit?.only?.length) return;
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setVisible(true);
            }, 180);
        });

        const offFinish = router.on('finish', () => {
            clearTimeout(timerRef.current);
            setVisible(false);
        });

        return () => {
            clearTimeout(timerRef.current);
            offStart();
            offFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="appsalon-loader-overlay" role="status" aria-live="polite" aria-label="Cargando App Salón">
            <div className="appsalon-loader-card">
                <div className="appsalon-loader-ring">
                    <span className="ring-spinner" aria-hidden="true" />
                    <img src="/img/icono.png" alt="App Salón" className="loader-favicon" />
                </div>
                <strong className="loader-brand">App Salón</strong>
                <span className="loader-sub">Preparando tu experiencia...</span>
            </div>
        </div>
    );
}
