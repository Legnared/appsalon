import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import 'react-day-picker/style.css';

function parseIsoToLocalDate(isoStr) {
    if (!isoStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return undefined;
    const [y, m, d] = isoStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDateToIso(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatLabelEs(date) {
    if (!date) return '';
    const texto = date.toLocaleDateString('es-MX', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function BarberDatePicker({
    id,
    value = '',
    onChange,
    minDate = '',
    disableSundays = false,
    onSundayBlocked,
    placeholder = 'Selecciona una fecha',
}) {
    const [abierto, setAbierto] = useState(false);
    const containerRef = useRef(null);

    const selectedDate = useMemo(() => parseIsoToLocalDate(value), [value]);
    const minLocalDate = useMemo(() => parseIsoToLocalDate(minDate), [minDate]);

    useEffect(() => {
        if (!abierto) return;
        const handleOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setAbierto(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') setAbierto(false);
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [abierto]);

    const disabledMatchers = useMemo(() => {
        const rules = [];
        if (minLocalDate) {
            rules.push({ before: minLocalDate });
        }
        if (disableSundays) {
            rules.push({ dayOfWeek: [0] });
        }
        return rules;
    }, [minLocalDate, disableSundays]);

    const handleSelect = (day) => {
        if (!day) return;
        if (disableSundays && day.getDay() === 0) {
            onSundayBlocked?.();
            return;
        }
        onChange?.(formatDateToIso(day));
        setAbierto(false);
    };

    const handleHoy = () => {
        const hoy = new Date();
        if (disableSundays && hoy.getDay() === 0) {
            onSundayBlocked?.();
            return;
        }
        onChange?.(formatDateToIso(hoy));
        setAbierto(false);
    };

    return (
        <div className="barber-datepicker" ref={containerRef}>
            <button
                id={id}
                type="button"
                className={`barber-datepicker-trigger ${abierto ? 'abierto' : ''}`}
                onClick={() => setAbierto((v) => !v)}
                aria-expanded={abierto}
                aria-haspopup="dialog"
            >
                <span className={selectedDate ? 'valor' : 'placeholder'}>
                    {selectedDate ? formatLabelEs(selectedDate) : placeholder}
                </span>
                <svg
                    className="icono-calendario"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </button>

            {abierto && (
                <div className="barber-datepicker-popover" role="dialog" aria-label="Selector de fecha">
                    <DayPicker
                        mode="single"
                        locale={es}
                        weekStartsOn={1}
                        selected={selectedDate}
                        defaultMonth={selectedDate || minLocalDate || new Date()}
                        onSelect={handleSelect}
                        disabled={disabledMatchers}
                        showOutsideDays
                    />
                    <div className="barber-datepicker-footer">
                        {disableSundays && (
                            <span className="nota-horario">Cerrado domingos</span>
                        )}
                        <button
                            type="button"
                            className="btn-ir-hoy"
                            onClick={handleHoy}
                        >
                            Ir a hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
