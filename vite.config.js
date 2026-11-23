import path from 'path';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/scss/app.scss', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        wayfinder({
            formVariants: true,
        }),
    ],
    css: {
        postcss: {
            plugins: [],
        },
        preprocessorOptions: {
            scss: {
                loadPaths: [path.resolve(__dirname, 'resources/scss')],
                silenceDeprecations: ['color-functions', 'global-builtin'],
            },
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
