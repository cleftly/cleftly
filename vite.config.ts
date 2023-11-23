import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [sveltekit(), nodePolyfills()],
    clearScreen: false,
    server: {
        port: 3009,
        strictPort: true
    },
    envPrefix: ['VITE_', 'PUBLIC_']
});
