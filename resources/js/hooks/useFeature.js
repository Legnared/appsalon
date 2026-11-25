import { usePage } from '@inertiajs/react';

/**
 * Devuelve todos los feature flags activos del tenant actual.
 */
export function useFeatures() {
    const { features } = usePage().props;
    return features || {};
}

/**
 * Verifica si un módulo específico está habilitado para la barbería actual.
 */
export default function useFeature(key, fallback = true) {
    const features = useFeatures();
    if (Object.prototype.hasOwnProperty.call(features, key)) {
        return Boolean(features[key]);
    }
    return fallback;
}
