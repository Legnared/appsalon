import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import MainLayout from './Layouts/MainLayout';

createInertiaApp({
    title: (title) => (title ? `${title} - App Salón` : 'App Salón - Barbería'),
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Página Inertia no encontrada: ${name}`);
        }

        page.default.layout = page.default.layout || ((pageNode) => <MainLayout>{pageNode}</MainLayout>);
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#d4a259',
    },
});
