import { useEffect, useState } from 'react';

const STORAGE_KEY = 'appsalon_texto_grande';

export default function AccessibilityToggle() {
    const [grande, setGrande] = useState(false);

    useEffect(() => {
        const guardado = window.localStorage.getItem(STORAGE_KEY) === '1';
        setGrande(guardado);
        document.documentElement.classList.toggle('texto-grande', guardado);
    }, []);

    const toggle = () => {
        const siguiente = !grande;
        setGrande(siguiente);
        document.documentElement.classList.toggle('texto-grande', siguiente);
        window.localStorage.setItem(STORAGE_KEY, siguiente ? '1' : '0');
    };

    return (
        <button
            type="button"
            className={`a11y-toggle ${grande ? 'activo' : ''}`}
            onClick={toggle}
            title={grande ? 'Restaurar tamaño de texto' : 'Aumentar tamaño de texto'}
            aria-label={grande ? 'Restaurar tamaño de texto' : 'Aumentar tamaño de texto'}
        >
            {grande ? 'A-' : 'A+'}
        </button>
    );
}
